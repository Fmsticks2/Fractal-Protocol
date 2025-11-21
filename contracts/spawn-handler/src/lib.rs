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

// ABI and parameters for the Spawn Handler (SDK 0.15)
pub mod spawn_handler {
    use super::*;
    use linera_sdk::abi::ContractAbi;

    #[derive(Debug, Deserialize, Serialize)]
    pub enum Operation {
        Initialize { admin: ChainId },
        CreateSpawnRule {
            rule_id: String,
            trigger_condition: TriggerCondition,
            spawn_template: SpawnTemplate,
        },
        UpdateSpawnRule { rule_id: String, active: bool },
        ProcessPendingSpawns,
    }

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub struct ResponseBytes(pub Vec<u8>);

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub struct Parameters;

    #[derive(Debug)]
    pub struct SpawnHandlerAbi;

    impl ContractAbi for SpawnHandlerAbi {
        type Operation = Operation;
        type Response = ResponseBytes;
    }
}

/// Root state stored as a single register to avoid custom View macros
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct SpawnHandlerStateData {
    pub spawn_rules: HashMap<String, SpawnRule>,
    pub pending_spawns: Vec<PendingSpawn>,
    pub admin: Option<ChainId>,
}

type SpawnHandlerState = RegisterView<SpawnHandlerStateData>;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SpawnRule {
    pub rule_id: String,
    pub trigger_condition: TriggerCondition,
    pub spawn_template: SpawnTemplate,
    pub active: bool,
    pub created_by: ChainId,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum TriggerCondition {
    MarketResolution {
        market_pattern: String, // Regex pattern for market questions
        outcome_pattern: String, // Regex pattern for outcomes
    },
    TimeDelay {
        delay_seconds: u64,
    },
    CustomLogic {
        logic_hash: String, // Hash of custom logic code
    },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SpawnTemplate {
    pub question_template: String, // Template with placeholders like {parent_question}, {outcome}
    pub outcomes: Vec<String>,
    pub expiry_offset_seconds: u64,
    pub seed_liquidity_ratio: f64, // Ratio of parent market's total stake
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PendingSpawn {
    pub spawn_id: String,
    pub parent_market_id: String,
    pub parent_outcome: String,
    pub spawn_template: SpawnTemplate,
    pub scheduled_time: Timestamp,
    pub processed: bool,
}

use spawn_handler::Operation;

/// Messages for cross-chain communication
#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    MarketResolved {
        market_id: String,
        question: String,
        winning_outcome: String,
        total_stake: Amount,
    },
    SpawnMarket {
        parent_market_id: String,
        question: String,
        outcomes: Vec<String>,
        expiry_time: Timestamp,
        seed_liquidity: Amount,
    },
}

/// Spawn handler errors
#[derive(Debug, Error)]
pub enum SpawnHandlerError {
    #[error("Unauthorized")]
    Unauthorized,
    #[error("Rule not found")]
    RuleNotFound,
    #[error("Invalid template")]
    InvalidTemplate,
    #[error("Processing failed")]
    ProcessingFailed,
}

/// Spawn handler contract implementation (SDK 0.15)
pub struct SpawnHandlerContract {
    state: SpawnHandlerState,
    runtime: ContractRuntime<Self>,
}

impl Contract for SpawnHandlerContract {
    type Message = Message;
    type Parameters = spawn_handler::Parameters;
    type InstantiationArgument = spawn_handler::Parameters;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = <SpawnHandlerState as View>::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        SpawnHandlerContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {}

    async fn execute_operation(&mut self, operation: Operation) -> spawn_handler::ResponseBytes {
        match operation {
            Operation::Initialize { admin } => {
                if self.state.get().admin.is_some() {
                    // already initialized; ignore
                } else {
                    let mut data = self.state.get().clone();
                    data.admin = Some(admin);
                    self.state.set(data);
                    // create default spawn rules
                    let creator = self.runtime.chain_id();
                    self.create_default_rules(creator).await;
                }
            }
            Operation::CreateSpawnRule {
                rule_id,
                trigger_condition,
                spawn_template,
            } => {
                let rule = SpawnRule {
                    rule_id: rule_id.clone(),
                    trigger_condition,
                    spawn_template,
                    active: true,
                    created_by: self.runtime.chain_id(),
                };
                let mut data = self.state.get().clone();
                data.spawn_rules.insert(rule_id, rule);
                self.state.set(data);
            }
            Operation::UpdateSpawnRule { rule_id, active } => {
                let mut data = self.state.get().clone();
                if let Some(rule) = data.spawn_rules.get_mut(&rule_id) {
                    if rule.created_by != self.runtime.chain_id()
                        && data.admin != Some(self.runtime.chain_id())
                    {
                        // unauthorized; ignore
                    } else {
                        rule.active = active;
                        self.state.set(data);
                    }
                }
            }
            Operation::ProcessPendingSpawns => {
                // minimal: mark due spawns as processed without dispatch
                let current_time = self.runtime.system_time();
                let mut data = self.state.get().clone();
                for p in data.pending_spawns.iter_mut() {
                    if !p.processed && current_time >= p.scheduled_time {
                        p.processed = true;
                    }
                }
                self.state.set(data);
            }
        }
        spawn_handler::ResponseBytes(Vec::new())
    }

    async fn execute_message(&mut self, _message: Message) {}

    async fn store(self) {
        let mut batch = Batch::default();
        self.state
            .pre_save(&mut batch)
            .expect("Failed to pre-save SpawnHandler state");
        let mut context = self.runtime.root_view_storage_context();
        let store = context.store();
        WritableKeyValueStore::write_batch(store, batch)
            .await
            .expect("Failed to write SpawnHandler batch");
    }
}

impl SpawnHandlerContract {
    async fn create_default_rules(&mut self, creator: ChainId) {
        // Default rule for political events
        let political_rule = SpawnRule {
            rule_id: "political_consequences".to_string(),
            trigger_condition: TriggerCondition::MarketResolution {
                market_pattern: ".*election.*|.*vote.*|.*policy.*".to_string(),
                outcome_pattern: ".*".to_string(),
            },
            spawn_template: SpawnTemplate {
                question_template: "What will be the economic impact of {outcome}?".to_string(),
                outcomes: vec![
                    "Significant positive impact".to_string(),
                    "Moderate positive impact".to_string(),
                    "No significant impact".to_string(),
                    "Moderate negative impact".to_string(),
                    "Significant negative impact".to_string(),
                ],
                expiry_offset_seconds: 30 * 24 * 3600, // 30 days
                seed_liquidity_ratio: 0.1, // 10% of parent
            },
            active: true,
            created_by: creator,
        };

        // Default rule for sports events
        let sports_rule = SpawnRule {
            rule_id: "sports_aftermath".to_string(),
            trigger_condition: TriggerCondition::MarketResolution {
                market_pattern: ".*championship.*|.*tournament.*|.*match.*".to_string(),
                outcome_pattern: ".*".to_string(),
            },
            spawn_template: SpawnTemplate {
                question_template: "How will {outcome} affect team performance next season?".to_string(),
                outcomes: vec![
                    "Significantly better".to_string(),
                    "Slightly better".to_string(),
                    "No change".to_string(),
                    "Slightly worse".to_string(),
                    "Significantly worse".to_string(),
                ],
                expiry_offset_seconds: 90 * 24 * 3600, // 90 days
                seed_liquidity_ratio: 0.05, // 5% of parent
            },
            active: true,
            created_by: creator,
        };

        let mut data = self.state.get().clone();
        data.spawn_rules.insert("political_consequences".to_string(), political_rule);
        data.spawn_rules.insert("sports_aftermath".to_string(), sports_rule);
        self.state.set(data);
    }

    fn matches_trigger_condition(
        &self,
        condition: &TriggerCondition,
        question: &str,
        outcome: &str,
    ) -> bool {
        match condition {
            TriggerCondition::MarketResolution {
                market_pattern,
                outcome_pattern,
            } => {
                // Simple pattern matching (in production, use regex crate)
                question.to_lowercase().contains(&market_pattern.to_lowercase())
                    && outcome.to_lowercase().contains(&outcome_pattern.to_lowercase())
            }
            TriggerCondition::TimeDelay { .. } => true, // Always matches, delay handled elsewhere
            TriggerCondition::CustomLogic { .. } => false, // Not implemented yet
        }
    }

    fn process_template(&self, template: &str, market_id: &str, outcome: &str) -> String {
        template
            .replace("{parent_market_id}", market_id)
            .replace("{outcome}", outcome)
            .replace("{parent_question}", "the previous event") // Simplified
    }
}

impl WithContractAbi for SpawnHandlerContract {
    type Abi = spawn_handler::SpawnHandlerAbi;
}

// Export the contract implementation for the Wasm module
linera_sdk::contract!(SpawnHandlerContract);