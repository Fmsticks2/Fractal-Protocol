use linera_sdk::{
    base::{Amount, ApplicationId, ChainId, Timestamp},
    Contract,
    views::{MapView, View},
    contract::{
        ApplicationCallResult, CalleeContext, ExecutionResult, MessageContext,
        OperationContext, SessionCallResult, ViewStateStorage,
    },
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

/// Factory contract state
#[derive(Debug, Default, Deserialize, Serialize)]
pub struct FactoryState {
    pub markets: HashMap<String, MarketInfo>,
    pub market_count: u64,
    pub admin: Option<ChainId>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct MarketInfo {
    pub market_id: String,
    pub chain_id: ChainId,
    pub question: String,
    pub outcomes: Vec<String>,
    pub parent_market_id: Option<String>,
    pub child_markets: Vec<String>,
    pub created_at: Timestamp,
    pub creator: ChainId,
    pub resolved: bool,
}

/// Factory operations
#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    Initialize {
        admin: ChainId,
    },
    CreateMarket {
        question: String,
        outcomes: Vec<String>,
        expiry_time: Timestamp,
        parent_market_id: Option<String>,
    },
    RegisterMarket {
        market_info: MarketInfo,
    },
}

/// Messages for cross-chain communication
#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    SpawnSubMarket {
        parent_market_id: String,
        parent_outcome: String,
        new_question: String,
        new_outcomes: Vec<String>,
        seed_liquidity: Amount,
    },
    MarketResolved {
        market_id: String,
        winning_outcome: String,
    },
}

/// Factory contract errors
#[derive(Debug, Error)]
pub enum FactoryError {
    #[error("Unauthorized")]
    Unauthorized,
    #[error("Market not found")]
    MarketNotFound,
    #[error("Invalid parameters")]
    InvalidParameters,
    #[error("Market already exists")]
    MarketAlreadyExists,
}

/// Factory contract implementation
pub struct FactoryContract;

impl Contract for FactoryContract {
    type Message = Message;
    type Parameters = ();
    type State = FactoryState;

    async fn load(context: &OperationContext) -> Self {
        FactoryContract
    }

    async fn instantiate(&mut self, context: &OperationContext, _argument: ()) {
        // Initialize empty factory state
    }

    async fn execute_operation(
        &mut self,
        context: &OperationContext,
        operation: Operation,
    ) -> ExecutionResult<Self::Message> {
        let mut state = context.state_mut().await;

        match operation {
            Operation::Initialize { admin } => {
                if state.admin.is_some() {
                    return Err(FactoryError::Unauthorized.into());
                }
                state.admin = Some(admin);
                Ok(ExecutionResult::default())
            }

            Operation::CreateMarket {
                question,
                outcomes,
                expiry_time,
                parent_market_id,
            } => {
                if outcomes.len() < 2 {
                    return Err(FactoryError::InvalidParameters.into());
                }

                let market_id = format!("market_{}", state.market_count);
                state.market_count += 1;

                let market_info = MarketInfo {
                    market_id: market_id.clone(),
                    chain_id: context.chain_id(),
                    question: question.clone(),
                    outcomes: outcomes.clone(),
                    parent_market_id: parent_market_id.clone(),
                    child_markets: Vec::new(),
                    created_at: context.system_time(),
                    creator: context.chain_id(),
                    resolved: false,
                };

                state.markets.insert(market_id.clone(), market_info);

                // If this is a child market, update parent's child list
                if let Some(parent_id) = parent_market_id {
                    if let Some(parent_market) = state.markets.get_mut(&parent_id) {
                        parent_market.child_markets.push(market_id);
                    }
                }

                Ok(ExecutionResult::default())
            }

            Operation::RegisterMarket { market_info } => {
                if state.markets.contains_key(&market_info.market_id) {
                    return Err(FactoryError::MarketAlreadyExists.into());
                }

                state.markets.insert(market_info.market_id.clone(), market_info);
                Ok(ExecutionResult::default())
            }
        }
    }

    async fn execute_message(
        &mut self,
        context: &MessageContext,
        message: Message,
    ) -> ExecutionResult<Self::Message> {
        let mut state = context.state_mut().await;

        match message {
            Message::SpawnSubMarket {
                parent_market_id,
                parent_outcome,
                new_question,
                new_outcomes,
                seed_liquidity,
            } => {
                // Create a new sub-market based on parent market resolution
                let market_id = format!("market_{}_{}", state.market_count, parent_outcome);
                state.market_count += 1;

                let market_info = MarketInfo {
                    market_id: market_id.clone(),
                    chain_id: context.chain_id(),
                    question: new_question,
                    outcomes: new_outcomes,
                    parent_market_id: Some(parent_market_id.clone()),
                    child_markets: Vec::new(),
                    created_at: context.system_time(),
                    creator: context.chain_id(),
                    resolved: false,
                };

                state.markets.insert(market_id.clone(), market_info);

                // Update parent market's child list
                if let Some(parent_market) = state.markets.get_mut(&parent_market_id) {
                    parent_market.child_markets.push(market_id);
                }

                Ok(ExecutionResult::default())
            }

            Message::MarketResolved {
                market_id,
                winning_outcome,
            } => {
                if let Some(market) = state.markets.get_mut(&market_id) {
                    market.resolved = true;
                }

                // Trigger creation of conditional sub-markets
                let spawn_message = Message::SpawnSubMarket {
                    parent_market_id: market_id,
                    parent_outcome: winning_outcome.clone(),
                    new_question: format!("What are the consequences of '{}'?", winning_outcome),
                    new_outcomes: vec![
                        "Significant positive impact".to_string(),
                        "Moderate positive impact".to_string(),
                        "No significant impact".to_string(),
                        "Moderate negative impact".to_string(),
                        "Significant negative impact".to_string(),
                    ],
                    seed_liquidity: Amount::from_tokens(100), // Default seed liquidity
                };

                let mut result = ExecutionResult::default();
                result.messages.push((context.chain_id(), spawn_message));

                Ok(result)
            }
        }
    }

    async fn handle_application_call(
        &mut self,
        context: &CalleeContext,
        call: Vec<u8>,
        forwarded_sessions: Vec<SessionCallResult>,
    ) -> ApplicationCallResult<Self::Message, Self::Response, Self::SessionState> {
        ApplicationCallResult::default()
    }
}

/// Query interface for the factory contract
impl FactoryContract {
    pub async fn get_all_markets(
        context: &OperationContext,
    ) -> Result<Vec<MarketInfo>, FactoryError> {
        let state = context.state().await;
        Ok(state.markets.values().cloned().collect())
    }

    pub async fn get_market_by_id(
        context: &OperationContext,
        market_id: &str,
    ) -> Result<MarketInfo, FactoryError> {
        let state = context.state().await;
        state
            .markets
            .get(market_id)
            .cloned()
            .ok_or(FactoryError::MarketNotFound)
    }

    pub async fn get_child_markets(
        context: &OperationContext,
        parent_id: &str,
    ) -> Result<Vec<MarketInfo>, FactoryError> {
        let state = context.state().await;
        let parent_market = state
            .markets
            .get(parent_id)
            .ok_or(FactoryError::MarketNotFound)?;

        let child_markets: Vec<MarketInfo> = parent_market
            .child_markets
            .iter()
            .filter_map(|child_id| state.markets.get(child_id).cloned())
            .collect();

        Ok(child_markets)
    }

    pub async fn get_market_tree(
        context: &OperationContext,
        root_market_id: &str,
    ) -> Result<MarketTree, FactoryError> {
        let state = context.state().await;
        
        fn build_tree(
            markets: &HashMap<String, MarketInfo>,
            market_id: &str,
        ) -> Option<MarketTree> {
            let market = markets.get(market_id)?;
            let children: Vec<MarketTree> = market
                .child_markets
                .iter()
                .filter_map(|child_id| build_tree(markets, child_id))
                .collect();

            Some(MarketTree {
                market: market.clone(),
                children,
            })
        }

        build_tree(&state.markets, root_market_id).ok_or(FactoryError::MarketNotFound)
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct MarketTree {
    pub market: MarketInfo,
    pub children: Vec<MarketTree>,
}