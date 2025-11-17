#![recursion_limit = "1024"]

use linera_sdk::{
    abi::WithContractAbi,
    contract::ContractRuntime,
    Contract,
    views::{RegisterView, View},
};
use linera_views::{batch::Batch, store::WritableKeyValueStore};
use linera_views::context::Context;
use serde::{Deserialize, Serialize};

// Define the ABI types shared by the contract and service
pub mod hello {
    use super::*;
    use linera_sdk::abi::{ContractAbi, ServiceAbi};
    use async_graphql::{Request, Response};

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub enum Operation {
        Increment { by: u64 },
    }

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub enum Message {}

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub struct Parameters;

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub struct ResponseBytes(pub Vec<u8>);
    
    // No sessions used by this simple app
    pub type Session = ();

    #[derive(Debug)]
    pub struct HelloAbi;

    impl ContractAbi for HelloAbi {
        type Operation = Operation;
        type Response = ResponseBytes;
    }

    impl ServiceAbi for HelloAbi {
        type Query = Request;
        type QueryResponse = Response;
    }
}

// Application state: simple counter stored as a register view
type HelloState = RegisterView<u64>;

pub struct HelloContract {
    state: HelloState,
    runtime: ContractRuntime<Self>,
}

impl Contract for HelloContract {
    type Message = hello::Message;
    type Parameters = hello::Parameters;
    type InstantiationArgument = hello::Parameters;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = <RegisterView<u64> as View>::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        HelloContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // Initialize counter to 0
        self.state.set(0);
    }

    async fn execute_operation(&mut self, operation: hello::Operation) -> hello::ResponseBytes {
        match operation {
            hello::Operation::Increment { by } => {
                let current = *self.state.get();
                self.state.set(current.saturating_add(by));
            }
        }
        hello::ResponseBytes(Vec::new())
    }

    async fn execute_message(&mut self, _message: hello::Message) {
        // No messages in this simple app
    }

    async fn store(self) {
        let mut batch = Batch::default();
        self.state
            .pre_save(&mut batch)
            .expect("Failed to pre-save Hello state");
        let mut context = self.runtime.root_view_storage_context();
        let store = context.store();
        WritableKeyValueStore::write_batch(store, batch)
            .await
            .expect("Failed to write Hello batch");
    }
}

impl WithContractAbi for HelloContract {
    type Abi = hello::HelloAbi;
}

linera_sdk::contract!(HelloContract);