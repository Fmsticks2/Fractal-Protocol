use linera_sdk::{
    service::{service, ServiceRuntime},
    views::{RegisterView, View},
    Service, WithServiceAbi,
    base::{Amount, ChainId, Timestamp},
};
use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use std::collections::HashMap;
use std::sync::Arc;
use serde::{Deserialize, Serialize};

// Share ABI with the contract
pub use market_contract::market;

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct Bet {
    pub bettor: ChainId,
    pub amount: Amount,
    pub timestamp: Timestamp,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct MarketStateData {
    pub market_id: String,
    pub question: String,
    pub outcomes: Vec<String>,
    pub bets: HashMap<String, Vec<Bet>>, // per-outcome bets
    pub total_staked: Amount,
    pub resolved: bool,
    pub winning_outcome: Option<String>,
    pub child_markets: Vec<String>,
    pub expiry_time: Timestamp,
    pub creator: Option<ChainId>,
}

#[derive(View, Default)]
pub struct MarketState {
    pub data: RegisterView<MarketStateData>,
}

pub struct MarketService {
    state: MarketState,
    runtime: Arc<ServiceRuntime<Self>>,
}

impl WithServiceAbi for MarketService {
    type Abi = market::MarketAbi;
}

impl MarketService {
    fn data(&self) -> MarketStateData {
        self.state.data.get().clone()
    }
}

impl Service for MarketService {
    type Parameters = market::Parameters;

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = MarketState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MarketService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        // GraphQL schema
        struct QueryRoot {
            data: MarketStateData,
        }

        #[Object]
        impl QueryRoot {
            async fn market_id(&self) -> String { self.data.market_id.clone() }
            async fn question(&self) -> String { self.data.question.clone() }
            async fn outcomes(&self) -> Vec<String> { self.data.outcomes.clone() }
            async fn total_staked(&self) -> String { format!("{}", self.data.total_staked) }
            async fn resolved(&self) -> bool { self.data.resolved }
            async fn winning_outcome(&self) -> Option<String> { self.data.winning_outcome.clone() }
            async fn child_markets(&self) -> Vec<String> { self.data.child_markets.clone() }
            async fn expiry_time(&self) -> String { format!("{:?}", self.data.expiry_time) }
        }

        struct MutationRoot {
            runtime: Arc<ServiceRuntime<MarketService>>,
        }

        #[Object]
        impl MutationRoot {
            async fn place_bet(&self, outcome: String, amount_tokens: u128) -> bool {
                // Convert u128 to Amount inside the contract; service just schedules operation
                self.runtime.schedule_operation(&market::Operation::PlaceBet {
                    outcome,
                    // Contract will parse tokens from payload; this keeps service light
                    amount: Amount::from_tokens(amount_tokens),
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

service!(MarketService);