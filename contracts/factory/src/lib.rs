#![recursion_limit = "1024"]

use linera_sdk::{
    abi::WithContractAbi,
    base::{Amount, ChainId, Timestamp},
    contract::ContractRuntime,
    views::{RegisterView, View},
    Contract,
};
// no direct Batch usage; use View::flush to persist changes
use serde::{Deserialize, Serialize};
use linera_views::{batch::Batch, store::WritableKeyValueStore};
use linera_views::context::Context;
use std::collections::HashMap;
use thiserror::Error;

// ABI and parameters for the Factory contract (SDK 0.15)
pub mod factory {
    use super::*;
    use linera_sdk::abi::ContractAbi;

    #[derive(Debug, Deserialize, Serialize)]
    pub enum Operation {
        Initialize { admin: ChainId },
        CreateMarket {
            question: String,
            outcomes: Vec<String>,
            expiry_time: Timestamp,
            parent_market_id: Option<String>,
        },
        RegisterMarket { market_info: MarketInfo },
    }

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub struct ResponseBytes(pub Vec<u8>);

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub struct Parameters;

    #[derive(Debug)]
    pub struct FactoryAbi;

    impl ContractAbi for FactoryAbi {
        type Operation = Operation;
        type Response = ResponseBytes;
    }
}

/// Root state stored as a single register to avoid custom View macros
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct FactoryStateData {
    pub markets: HashMap<String, MarketInfo>,
    pub market_count: u64,
    pub admin: Option<ChainId>,
}

type FactoryState = RegisterView<FactoryStateData>;

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

use factory::Operation;

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

/// Factory contract implementation (SDK 0.15)
pub struct FactoryContract {
    state: FactoryState,
    runtime: ContractRuntime<Self>,
}

impl Contract for FactoryContract {
    type Message = Message;
    type Parameters = factory::Parameters;
    type InstantiationArgument = factory::Parameters;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = <FactoryState as View>::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        FactoryContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {}

    async fn execute_operation(&mut self, operation: Operation) -> factory::ResponseBytes {
        match operation {
            Operation::Initialize { admin } => {
                if self.state.get().admin.is_some() {
                    // already initialized; ignore
                } else {
                    let mut data = self.state.get().clone();
                    data.admin = Some(admin);
                    self.state.set(data);
                }
            }
            Operation::CreateMarket {
                question,
                outcomes,
                expiry_time: _expiry_time,
                parent_market_id,
            } => {
                if outcomes.len() < 2 {
                    // invalid; ignore
                } else {
                    let mut data = self.state.get().clone();
                    let market_id = format!("market_{}", data.market_count);
                    data.market_count = data.market_count.saturating_add(1);

                    let market_info = MarketInfo {
                        market_id: market_id.clone(),
                        chain_id: self.runtime.chain_id(),
                        question: question.clone(),
                        outcomes: outcomes.clone(),
                        parent_market_id: parent_market_id.clone(),
                        child_markets: Vec::new(),
                        created_at: self.runtime.system_time(),
                        creator: self.runtime.chain_id(),
                        resolved: false,
                    };

                    data.markets.insert(market_id.clone(), market_info);

                    if let Some(parent_id) = parent_market_id {
                        if let Some(parent_market) = data.markets.get_mut(&parent_id) {
                            parent_market.child_markets.push(market_id);
                        }
                    }
                    self.state.set(data);
                }
            }
            Operation::RegisterMarket { market_info } => {
                let mut data = self.state.get().clone();
                if data.markets.contains_key(&market_info.market_id) {
                    // already exists; ignore
                } else {
                    data.markets.insert(market_info.market_id.clone(), market_info);
                    self.state.set(data);
                }
            }
        }
        factory::ResponseBytes(Vec::new())
    }

    async fn execute_message(&mut self, _message: Message) {}

    async fn store(self) {
        let mut batch = Batch::default();
        self.state
            .pre_save(&mut batch)
            .expect("Failed to pre-save Factory state");
        let mut context = self.runtime.root_view_storage_context();
        let store = context.store();
        WritableKeyValueStore::write_batch(store, batch)
            .await
            .expect("Failed to write Factory batch");
    }
}

impl WithContractAbi for FactoryContract {
    type Abi = factory::FactoryAbi;
}

// Query helpers should be implemented in the service layer for SDK 0.15.

// Export the contract implementation for the Wasm module
linera_sdk::contract!(FactoryContract);