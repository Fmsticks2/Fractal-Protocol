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

/// Spawn handler state
#[derive(Debug, Default, Deserialize, Serialize)]
pub struct SpawnHandlerState {
    pub spawn_rules: HashMap<String, SpawnRule>,
    pub pending_spawns: Vec<PendingSpawn>,
    pub admin: Option<ChainId>,
}

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

/// Spawn handler operations
#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    Initialize {
        admin: ChainId,
    },
    CreateSpawnRule {
        rule_id: String,
        trigger_condition: TriggerCondition,
        spawn_template: SpawnTemplate,
    },
    UpdateSpawnRule {
        rule_id: String,
        active: bool,
    },
    ProcessPendingSpawns,
}

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

/// Spawn handler contract implementation
pub struct SpawnHandlerContract;

impl Contract for SpawnHandlerContract {
    type Message = Message;
    type Parameters = ();
    type State = SpawnHandlerState;

    async fn load(context: &OperationContext) -> Self {
        SpawnHandlerContract
    }

    async fn instantiate(&mut self, context: &OperationContext, _argument: ()) {
        // Initialize with default spawn rules
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
                    return Err(SpawnHandlerError::Unauthorized.into());
                }
                state.admin = Some(admin);
                
                // Create default spawn rules
                self.create_default_rules(&mut state, context.chain_id()).await;
                
                Ok(ExecutionResult::default())
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
                    created_by: context.chain_id(),
                };

                state.spawn_rules.insert(rule_id, rule);
                Ok(ExecutionResult::default())
            }

            Operation::UpdateSpawnRule { rule_id, active } => {
                if let Some(rule) = state.spawn_rules.get_mut(&rule_id) {
                    // Only creator or admin can update
                    if rule.created_by != context.chain_id() 
                        && state.admin != Some(context.chain_id()) {
                        return Err(SpawnHandlerError::Unauthorized.into());
                    }
                    rule.active = active;
                } else {
                    return Err(SpawnHandlerError::RuleNotFound.into());
                }

                Ok(ExecutionResult::default())
            }

            Operation::ProcessPendingSpawns => {
                let mut result = ExecutionResult::default();
                let current_time = context.system_time();

                for pending_spawn in &mut state.pending_spawns {
                    if !pending_spawn.processed && current_time >= pending_spawn.scheduled_time {
                        let spawn_message = Message::SpawnMarket {
                            parent_market_id: pending_spawn.parent_market_id.clone(),
                            question: self.process_template(
                                &pending_spawn.spawn_template.question_template,
                                &pending_spawn.parent_market_id,
                                &pending_spawn.parent_outcome,
                            ),
                            outcomes: pending_spawn.spawn_template.outcomes.clone(),
                            expiry_time: current_time.saturating_add_micros(
                                pending_spawn.spawn_template.expiry_offset_seconds * 1_000_000
                            ),
                            seed_liquidity: Amount::from_tokens(100), // Default for now
                        };

                        result.messages.push((context.chain_id(), spawn_message));
                        pending_spawn.processed = true;
                    }
                }

                Ok(result)
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
            Message::MarketResolved {
                market_id,
                question,
                winning_outcome,
                total_stake,
            } => {
                let mut result = ExecutionResult::default();

                // Check all spawn rules for matches
                for (rule_id, rule) in &state.spawn_rules {
                    if !rule.active {
                        continue;
                    }

                    if self.matches_trigger_condition(&rule.trigger_condition, &question, &winning_outcome) {
                        let spawn_id = format!("{}_{}", rule_id, context.system_time().micros());
                        
                        let pending_spawn = PendingSpawn {
                            spawn_id: spawn_id.clone(),
                            parent_market_id: market_id.clone(),
                            parent_outcome: winning_outcome.clone(),
                            spawn_template: rule.spawn_template.clone(),
                            scheduled_time: context.system_time(),
                            processed: false,
                        };

                        state.pending_spawns.push(pending_spawn);

                        // Immediately process if no delay
                        if let TriggerCondition::TimeDelay { delay_seconds } = &rule.trigger_condition {
                            if *delay_seconds == 0 {
                                let spawn_message = Message::SpawnMarket {
                                    parent_market_id: market_id.clone(),
                                    question: self.process_template(
                                        &rule.spawn_template.question_template,
                                        &market_id,
                                        &winning_outcome,
                                    ),
                                    outcomes: rule.spawn_template.outcomes.clone(),
                                    expiry_time: context.system_time().saturating_add_micros(
                                        rule.spawn_template.expiry_offset_seconds * 1_000_000
                                    ),
                                    seed_liquidity: Amount::from_tokens(
                                        (total_stake.as_tokens() as f64 * rule.spawn_template.seed_liquidity_ratio) as u64
                                    ),
                                };

                                result.messages.push((context.chain_id(), spawn_message));
                            }
                        }
                    }
                }

                Ok(result)
            }

            Message::SpawnMarket { .. } => {
                // Forward to factory contract
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
        ApplicationCallResult::default()
    }
}

impl SpawnHandlerContract {
    async fn create_default_rules(&self, state: &mut SpawnHandlerState, creator: ChainId) {
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

        state.spawn_rules.insert("political_consequences".to_string(), political_rule);
        state.spawn_rules.insert("sports_aftermath".to_string(), sports_rule);
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

// Export the contract implementation for the Wasm module
linera_sdk::contract::contract!(SpawnHandlerContract);