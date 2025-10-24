import { useState, useCallback, useEffect } from 'react';
import type { Market, MarketOdds, CreateMarketForm, PlaceBetForm, MarketTree } from '../types';

// Mock market data for development
const mockMarkets: Market[] = [
  {
    id: 'market_1',
    question: 'Will Bitcoin reach $100,000 by the end of 2024?',
    outcomes: ['Yes', 'No'],
    totalStaked: 15420.50,
    resolved: false,
    childMarkets: ['market_2', 'market_3'],
    expiryTime: new Date('2024-12-31T23:59:59'),
    creator: '0x1234567890abcdef1234567890abcdef12345678',
    createdAt: new Date('2024-01-15T10:00:00'),
  },
  {
    id: 'market_2',
    question: 'If Bitcoin reaches $100k, will it happen before October 2024?',
    outcomes: ['Before October', 'After October'],
    totalStaked: 3250.75,
    resolved: false,
    childMarkets: [],
    parentMarketId: 'market_1',
    expiryTime: new Date('2024-10-31T23:59:59'),
    creator: '0x1234567890abcdef1234567890abcdef12345678',
    createdAt: new Date('2024-01-16T14:30:00'),
  },
  {
    id: 'market_3',
    question: 'If Bitcoin reaches $100k, which catalyst will be primary?',
    outcomes: ['ETF Approval', 'Institutional Adoption', 'Regulatory Clarity', 'Other'],
    totalStaked: 8750.25,
    resolved: false,
    childMarkets: [],
    parentMarketId: 'market_1',
    expiryTime: new Date('2024-12-15T23:59:59'),
    creator: '0x1234567890abcdef1234567890abcdef12345678',
    createdAt: new Date('2024-01-17T09:15:00'),
  },
  {
    id: 'market_4',
    question: 'Who will win the 2024 US Presidential Election?',
    outcomes: ['Democratic Candidate', 'Republican Candidate', 'Third Party'],
    totalStaked: 45230.80,
    resolved: false,
    childMarkets: ['market_5'],
    expiryTime: new Date('2024-11-05T23:59:59'),
    creator: '0xabcdef1234567890abcdef1234567890abcdef12',
    createdAt: new Date('2024-01-10T08:00:00'),
  },
  {
    id: 'market_5',
    question: 'Will the winning candidate receive more than 300 electoral votes?',
    outcomes: ['Yes, more than 300', 'No, 300 or fewer'],
    totalStaked: 12450.30,
    resolved: false,
    childMarkets: [],
    parentMarketId: 'market_4',
    expiryTime: new Date('2024-11-06T12:00:00'),
    creator: '0xabcdef1234567890abcdef1234567890abcdef12',
    createdAt: new Date('2024-01-11T16:45:00'),
  },
];

const mockOdds: Record<string, MarketOdds> = {
  market_1: { 'Yes': 2.1, 'No': 1.9 },
  market_2: { 'Before October': 1.8, 'After October': 2.2 },
  market_3: { 'ETF Approval': 3.2, 'Institutional Adoption': 2.8, 'Regulatory Clarity': 4.1, 'Other': 5.5 },
  market_4: { 'Democratic Candidate': 1.9, 'Republican Candidate': 2.0, 'Third Party': 15.0 },
  market_5: { 'Yes, more than 300': 1.7, 'No, 300 or fewer': 2.3 },
};

export const useMarkets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [odds, setOdds] = useState<Record<string, MarketOdds>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial market data
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        setLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setMarkets(mockMarkets);
        setOdds(mockOdds);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load markets');
      } finally {
        setLoading(false);
      }
    };

    loadMarkets();
  }, []);

  const createMarket = useCallback(async (form: CreateMarketForm): Promise<string> => {
    try {
      setLoading(true);
      
      // Simulate contract interaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newMarket: Market = {
        id: `market_${Date.now()}`,
        question: form.question,
        outcomes: form.outcomes,
        totalStaked: 0,
        resolved: false,
        childMarkets: [],
        parentMarketId: form.parentMarketId,
        expiryTime: form.expiryTime,
        creator: '0x1234567890abcdef1234567890abcdef12345678', // Mock user address
        createdAt: new Date(),
      };

      // Add to markets list
      setMarkets(prev => [newMarket, ...prev]);
      
      // Initialize odds (equal probability)
      const initialOdds: MarketOdds = {};
      const equalOdds = form.outcomes.length;
      form.outcomes.forEach(outcome => {
        initialOdds[outcome] = equalOdds;
      });
      setOdds(prev => ({ ...prev, [newMarket.id]: initialOdds }));

      // If this is a sub-market, update parent's child markets
      if (form.parentMarketId) {
        setMarkets(prev => prev.map(market => 
          market.id === form.parentMarketId
            ? { ...market, childMarkets: [...market.childMarkets, newMarket.id] }
            : market
        ));
      }

      return newMarket.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create market';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const placeBet = useCallback(async (form: PlaceBetForm): Promise<void> => {
    try {
      setLoading(true);
      
      // Simulate contract interaction delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update market total staked
      setMarkets(prev => prev.map(market => 
        market.id === form.marketId
          ? { ...market, totalStaked: market.totalStaked + form.amount }
          : market
      ));

      // Update odds (simplified calculation)
      setOdds(prev => {
        const currentOdds = prev[form.marketId] || {};
        const updatedOdds = { ...currentOdds };
        
        // Decrease odds for the bet outcome (more money on it)
        if (updatedOdds[form.outcome]) {
          updatedOdds[form.outcome] = Math.max(1.1, updatedOdds[form.outcome] - 0.1);
        }
        
        return { ...prev, [form.marketId]: updatedOdds };
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place bet';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMarketById = useCallback((marketId: string): Market | undefined => {
    return markets.find(market => market.id === marketId);
  }, [markets]);

  const getMarketTree = useCallback((): MarketTree[] => {
    const marketMap = new Map<string, Market>();
    markets.forEach(market => marketMap.set(market.id, market));

    const buildTree = (market: Market): MarketTree => {
      const children = market.childMarkets
        .map(childId => marketMap.get(childId))
        .filter((child): child is Market => child !== undefined)
        .map(child => buildTree(child));

      return { market, children };
    };

    // Get root markets (no parent)
    const rootMarkets = markets.filter(market => !market.parentMarketId);
    return rootMarkets.map(market => buildTree(market));
  }, [markets]);

  const refreshMarkets = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real implementation, this would fetch fresh data from the blockchain
      // For now, we'll just update the loading state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh markets');
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveMarket = useCallback(async (marketId: string, winningOutcome: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Simulate contract interaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMarkets(prev => prev.map(market => 
        market.id === marketId
          ? { ...market, resolved: true, winningOutcome }
          : market
      ));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve market';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    markets,
    odds,
    loading,
    error,
    createMarket,
    placeBet,
    getMarketById,
    getMarketTree,
    refreshMarkets,
    resolveMarket,
  };
};