use linera_sdk::{
    service::{service, ServiceRuntime},
    views::{RegisterView, View},
    Service, WithServiceAbi,
    linera_base_types::{Amount, ChainId, Timestamp},
};
use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use std::collections::HashMap;
use std::sync::Arc;
use serde::{Deserialize, Serialize};

// Share ABI with the contract
pub use factory_contract::factory;

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
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

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct FactoryStateData {
    pub markets: HashMap<String, MarketInfo>,
    pub market_count: u64,
    pub admin: Option<ChainId>,
}

#[derive(View, Default)]
pub struct FactoryState {
    pub data: RegisterView<FactoryStateData>,
}

pub struct FactoryService {
    state: FactoryState,
    runtime: Arc<ServiceRuntime<Self>>,
}

impl WithServiceAbi for FactoryService {
    type Abi = factory::FactoryAbi;
}

impl FactoryService {
    fn data(&self) -> FactoryStateData {
        self.state.data.get().clone()
    }
}

impl Service for FactoryService {
    type Parameters = factory::Parameters;

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = FactoryState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        FactoryService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        // GraphQL schema
        struct QueryRoot {
            data: FactoryStateData,
        }

        #[Object]
        impl QueryRoot {
            async fn market_count(&self) -> u64 { self.data.market_count }
            async fn market_ids(&self) -> Vec<String> { self.data.markets.keys().cloned().collect() }
            async fn admin(&self) -> Option<String> { self.data.admin.map(|c| format!("{}", c)) }
        }

        struct MutationRoot {
            runtime: Arc<ServiceRuntime<FactoryService>>,
        }

        #[Object]
        impl MutationRoot {
            async fn create_market(&self, question: String, outcomes: Vec<String>, parent_market_id: Option<String>) -> bool {
                self.runtime.schedule_operation(&factory::Operation::CreateMarket {
                    question,
                    outcomes,
                    expiry_time: Timestamp::from_micros(0), // ignored by contract logic
                    parent_market_id,
                });
                true
            }
        }

        let schema = Schema::build(
            QueryRoot { data: self.data() },
            MutationRoot { runtime: self.runtime.clone() },
            EmptySubscription,
        )
        .finish();

        schema.execute(request).await
    }
}

service!(FactoryService);