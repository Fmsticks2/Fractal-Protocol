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

/// Market contract state
#[derive(Debug, Default, Deserialize, Serialize)]
pub struct MarketState {
    pub market_id: String,
    pub question: String,
    pub outcomes: Vec<String>,
    pub bets: HashMap<String, Vec<Bet>>, // outcome -> bets
    pub total_staked: Amount,
    pub resolved: bool,
    pub winning_outcome: Option<String>,
    pub child_markets: Vec<String>,
    pub expiry_time: Timestamp,
    pub creator: ChainId,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Bet {
    pub bettor: ChainId,
    pub amount: Amount,
    pub timestamp: Timestamp,
}

/// Operations that can be performed on the market
#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    CreateMarket {
        market_id: String,
        question: String,
        outcomes: Vec<String>,
        expiry_time: Timestamp,
    },
    PlaceBet {
        outcome: String,
        amount: Amount,
    },
    ResolveMarket {
        winning_outcome: String,
    },
}

/// Messages sent between contracts
#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    SpawnSubMarket {
        parent_market_id: String,
        parent_outcome: String,
        new_question: String,
        new_outcomes: Vec<String>,
        seed_liquidity: Amount,
    },
}

/// Market contract errors
#[derive(Debug, Error)]
pub enum MarketError {
    #[error("Market already exists")]
    MarketAlreadyExists,
    #[error("Market not found")]
    MarketNotFound,
    #[error("Market already resolved")]
    MarketAlreadyResolved,
    #[error("Market expired")]
    MarketExpired,
    #[error("Invalid outcome")]
    InvalidOutcome,
    #[error("Insufficient funds")]
    InsufficientFunds,
    #[error("Unauthorized")]
    Unauthorized,
}

/// Market contract implementation
pub struct MarketContract;

impl Contract for MarketContract {
    type Message = Message;
    type Parameters = ();
    type State = MarketState;

    async fn load(context: &OperationContext) -> Self {
        MarketContract
    }

    async fn instantiate(&mut self, context: &OperationContext, _argument: ()) {
        // Initialize empty market state
    }

    async fn execute_operation(
        &mut self,
        context: &OperationContext,
        operation: Operation,
    ) -> ExecutionResult<Self::Message> {
        let mut state = context.state_mut().await;
        
        match operation {
            Operation::CreateMarket {
                market_id,
                question,
                outcomes,
                expiry_time,
            } => {
                if !state.market_id.is_empty() {
                    return Err(MarketError::MarketAlreadyExists.into());
                }

                state.market_id = market_id;
                state.question = question;
                state.outcomes = outcomes.clone();
                state.expiry_time = expiry_time;
                state.creator = context.chain_id();
                
                // Initialize empty bets for each outcome
                for outcome in outcomes {
                    state.bets.insert(outcome, Vec::new());
                }

                Ok(ExecutionResult::default())
            }

            Operation::PlaceBet { outcome, amount } => {
                if state.resolved {
                    return Err(MarketError::MarketAlreadyResolved.into());
                }

                if context.system_time() > state.expiry_time {
                    return Err(MarketError::MarketExpired.into());
                }

                if !state.outcomes.contains(&outcome) {
                    return Err(MarketError::InvalidOutcome.into());
                }

                let bet = Bet {
                    bettor: context.chain_id(),
                    amount,
                    timestamp: context.system_time(),
                };

                state.bets.entry(outcome).or_default().push(bet);
                state.total_staked = state.total_staked.saturating_add(amount);

                Ok(ExecutionResult::default())
            }

            Operation::ResolveMarket { winning_outcome } => {
                if state.resolved {
                    return Err(MarketError::MarketAlreadyResolved.into());
                }

                if !state.outcomes.contains(&winning_outcome) {
                    return Err(MarketError::InvalidOutcome.into());
                }

                // Only creator or system can resolve
                if context.chain_id() != state.creator {
                    return Err(MarketError::Unauthorized.into());
                }

                state.resolved = true;
                state.winning_outcome = Some(winning_outcome.clone());

                // Trigger spawning of sub-markets
                let spawn_message = Message::SpawnSubMarket {
                    parent_market_id: state.market_id.clone(),
                    parent_outcome: winning_outcome,
                    new_question: format!("What happens after {}?", state.question),
                    new_outcomes: vec![
                        "Positive impact".to_string(),
                        "Negative impact".to_string(),
                        "No significant change".to_string(),
                    ],
                    seed_liquidity: state.total_staked.saturating_div(10), // 10% of parent pool
                };

                let mut result = ExecutionResult::default();
                result.messages.push((
                    context.chain_id(), // Send to factory contract
                    spawn_message,
                ));

                Ok(result)
            }
        }
    }

    async fn execute_message(
        &mut self,
        context: &MessageContext,
        message: Message,
    ) -> ExecutionResult<Self::Message> {
        match message {
            Message::SpawnSubMarket { .. } => {
                // This would be handled by the factory contract
                Ok(ExecutionResult::default())
            }
        }
    }

    async fn handle_application_call(
        &mut self,
        context: &CalleeContext,
        call: Vec<u8>,
        forwarded_sessions: Vec<SessionCallResult>,
    ) -> ApplicationCallResult<Self::Message, Self::Response, Self::SessionState> {
        // Handle cross-application calls
        ApplicationCallResult::default()
    }
}

/// Query interface for the market contract
impl MarketContract {
    pub async fn get_market_data(context: &OperationContext) -> Result<MarketState, MarketError> {
        let state = context.state().await;
        Ok(state.clone())
    }

    pub async fn get_odds(context: &OperationContext) -> Result<HashMap<String, f64>, MarketError> {
        let state = context.state().await;
        let mut odds = HashMap::new();

        for outcome in &state.outcomes {
            let outcome_bets = state.bets.get(outcome).unwrap_or(&Vec::new());
            let outcome_total: Amount = outcome_bets.iter().map(|bet| bet.amount).sum();
            
            if state.total_staked > Amount::ZERO {
                let probability = outcome_total.as_u128() as f64 / state.total_staked.as_u128() as f64;
                odds.insert(outcome.clone(), if probability > 0.0 { 1.0 / probability } else { 0.0 });
            } else {
                odds.insert(outcome.clone(), 1.0);
            }
        }

        Ok(odds)
    }

    pub async fn get_user_bets(
        context: &OperationContext,
        user: ChainId,
    ) -> Result<Vec<(String, Bet)>, MarketError> {
        let state = context.state().await;
        let mut user_bets = Vec::new();

        for (outcome, bets) in &state.bets {
            for bet in bets {
                if bet.bettor == user {
                    user_bets.push((outcome.clone(), bet.clone()));
                }
            }
        }

        Ok(user_bets)
    }
}

// Export the contract implementation for the Wasm module
linera_sdk::contract::contract!(MarketContract);