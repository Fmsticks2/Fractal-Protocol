export interface Market {
  id: string;
  question: string;
  outcomes: string[];
  totalStaked: number;
  resolved: boolean;
  winningOutcome?: string;
  childMarkets: string[];
  parentMarketId?: string;
  expiryTime: Date;
  creator: string;
  createdAt: Date;
}

export interface Bet {
  id: string;
  marketId: string;
  outcome: string;
  amount: number;
  bettor: string;
  timestamp: Date;
  odds: number;
}

export interface MarketOdds {
  [outcome: string]: number;
}

export interface MarketTree {
  market: Market;
  children: MarketTree[];
}

export interface User {
  address: string;
  balance: number;
  bets: Bet[];
}

export interface SpawnRule {
  id: string;
  triggerCondition: TriggerCondition;
  spawnTemplate: SpawnTemplate;
  active: boolean;
  createdBy: string;
}

export interface TriggerCondition {
  type: 'market_resolution' | 'time_delay' | 'custom_logic';
  marketPattern?: string;
  outcomePattern?: string;
  delaySeconds?: number;
  logicHash?: string;
}

export interface SpawnTemplate {
  questionTemplate: string;
  outcomes: string[];
  expiryOffsetSeconds: number;
  seedLiquidityRatio: number;
}

export interface WalletState {
  connected: boolean;
  address?: string;
  balance?: number;
  chainId?: string;
}

export interface AppState {
  markets: Market[];
  selectedMarket?: Market;
  user?: User;
  wallet: WalletState;
  loading: boolean;
  error?: string;
}

export interface CreateMarketForm {
  question: string;
  outcomes: string[];
  expiryTime: Date;
  parentMarketId?: string;
}

export interface PlaceBetForm {
  marketId: string;
  outcome: string;
  amount: number;
}