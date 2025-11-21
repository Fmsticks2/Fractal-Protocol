#![recursion_limit = "1024"]

use linera_sdk::{
    abi::WithContractAbi,
    base::{Amount, ChainId, Timestamp},
    contract::ContractRuntime,
    views::{RegisterView, View},
    Contract,
};
use linera_views::{batch::Batch, store::WritableKeyValueStore};
use linera_views::context::Context;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

// ABI and parameters for the Market contract (SDK 0.15)
pub mod market {
    use super::*;
    use linera_sdk::abi::ContractAbi;

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

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub struct ResponseBytes(pub Vec<u8>);

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub struct Parameters;

    #[derive(Debug)]
    pub struct MarketAbi;

    impl ContractAbi for MarketAbi {
        type Operation = Operation;
        type Response = ResponseBytes;
    }
}

/// Root state stored as a single register to avoid custom View macros
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct MarketStateData {
    pub market_id: String,
    pub question: String,
    pub outcomes: Vec<String>,
    pub bets: HashMap<String, Vec<Bet>>,
    pub total_staked: Amount,
    pub resolved: bool,
    pub winning_outcome: Option<String>,
    pub child_markets: Vec<String>,
    pub expiry_time: Timestamp,
    pub creator: Option<ChainId>,
}

type MarketState = RegisterView<MarketStateData>;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Bet {
    pub bettor: ChainId,
    pub amount: Amount,
    pub timestamp: Timestamp,
}

// Use ABI-defined operations
use market::Operation;

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

/// Market contract implementation (SDK 0.15)
pub struct MarketContract {
    state: MarketState,
    runtime: ContractRuntime<Self>,
}

impl Contract for MarketContract {
    type Message = Message;
    type Parameters = market::Parameters;
    type InstantiationArgument = market::Parameters;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = <MarketState as View>::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MarketContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        let mut data = self.state.get().clone();
        data.total_staked = Amount::ZERO;
        data.resolved = false;
        data.creator = None;
        self.state.set(data);
    }

    async fn execute_operation(&mut self, operation: Operation) -> market::ResponseBytes {
        match operation {
            Operation::CreateMarket {
                market_id,
                question,
                outcomes,
                expiry_time,
            } => {
                if !self.state.get().market_id.is_empty() {
                    // already exists; ignore
                } else {
                    let mut data = self.state.get().clone();
                    data.market_id = market_id;
                    data.question = question;
                    data.outcomes = outcomes.clone();
                    data.expiry_time = expiry_time;
                    data.creator = Some(self.runtime.chain_id());
                    let mut bets: HashMap<String, Vec<Bet>> = HashMap::new();
                    for outcome in outcomes {
                        bets.insert(outcome, Vec::new());
                    }
                    data.bets = bets;
                    self.state.set(data);
                }
            }
            Operation::PlaceBet { outcome, amount } => {
                let data = self.state.get().clone();
                if data.resolved {
                    // ignore if resolved
                } else if self.runtime.system_time() > data.expiry_time {
                    // expired; ignore
                } else if data.outcomes.contains(&outcome) {
                    let mut data = self.state.get().clone();
                    data.bets
                        .entry(outcome)
                        .or_default()
                        .push(Bet {
                            bettor: self.runtime.chain_id(),
                            amount,
                            timestamp: self.runtime.system_time(),
                        });
                    data.total_staked = data.total_staked.saturating_add(amount);
                    self.state.set(data);
                }
            }
            Operation::ResolveMarket { winning_outcome } => {
                let mut data = self.state.get().clone();
                if data.resolved {
                    // already resolved; ignore
                } else if !data.outcomes.contains(&winning_outcome) {
                    // invalid outcome; ignore
                } else if data.creator != Some(self.runtime.chain_id()) {
                    // unauthorized; ignore
                } else {
                    data.resolved = true;
                    data.winning_outcome = Some(winning_outcome);
                    self.state.set(data);
                    // message dispatch omitted in v0.15 port minimal version
                }
            }
        }
        market::ResponseBytes(Vec::new())
    }

    async fn execute_message(&mut self, _message: Message) {}

    async fn store(self) {
        let mut batch = Batch::default();
        self.state
            .pre_save(&mut batch)
            .expect("Failed to pre-save Market state");
        let mut context = self.runtime.root_view_storage_context();
        let store = context.store();
        WritableKeyValueStore::write_batch(store, batch)
            .await
            .expect("Failed to write Market batch");
    }
}

impl WithContractAbi for MarketContract {
    type Abi = market::MarketAbi;
}

// Query helpers should be exposed from a service in SDK 0.15.

// Export the contract implementation for the Wasm module
linera_sdk::contract!(MarketContract);