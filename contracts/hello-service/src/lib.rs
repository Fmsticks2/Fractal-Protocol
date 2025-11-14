use linera_sdk::{
    service::{service, ServiceRuntime},
    views::{RegisterView, View},
    Service, WithServiceAbi,
};
use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use std::sync::Arc;

// Share ABI module name with contract
pub use hello_contract::hello;

#[derive(View, Default)]
pub struct HelloState {
    pub value: RegisterView<u64>,
}

pub struct HelloService {
    state: HelloState,
    runtime: Arc<ServiceRuntime<Self>>,
}

impl WithServiceAbi for HelloService {
    type Abi = hello::HelloAbi;
}

impl Service for HelloService {
    type Parameters = hello::Parameters;

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = HelloState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        HelloService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        // GraphQL schema
        struct QueryRoot {
            value: u64,
        }

        #[Object]
        impl QueryRoot {
            async fn value(&self) -> u64 {
                self.value
            }
        }

        struct MutationRoot {
            runtime: Arc<ServiceRuntime<HelloService>>,
        }

        #[Object]
        impl MutationRoot {
            async fn increment(&self, by: u64) -> bool {
                self.runtime
                    .schedule_operation(&hello::Operation::Increment { by });
                true
            }
        }

        let schema = Schema::build(
            QueryRoot {
                value: *self.state.value.get(),
            },
            MutationRoot {
                runtime: self.runtime.clone(),
            },
            EmptySubscription,
        )
        .finish();

        schema.execute(request).await
    }
}

service!(HelloService);