import React from 'react';
import { Clock, Users, TrendingUp, GitBranch } from 'lucide-react';
import { Card, Button } from './ui';
import { Market, MarketOdds } from '../types';
import { formatCurrency, formatTimeRemaining, formatNumber, formatPercentage, calculateProbability } from '../utils';

interface MarketCardProps {
  market: Market;
  odds?: MarketOdds;
  onViewMarket: (marketId: string) => void;
  onPlaceBet?: (marketId: string) => void;
  showChildren?: boolean;
}

const MarketCard: React.FC<MarketCardProps> = ({
  market,
  odds,
  onViewMarket,
  onPlaceBet,
  showChildren = true,
}) => {
  const isExpired = new Date() > market.expiryTime;
  const hasChildren = market.childMarkets.length > 0;

  return (
    <Card hover className="market-card">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {market.question}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {isExpired ? 'Expired' : formatTimeRemaining(market.expiryTime)}
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                {formatCurrency(market.totalStaked)}
              </div>
              {hasChildren && showChildren && (
                <div className="flex items-center">
                  <GitBranch className="h-4 w-4 mr-1" />
                  {market.childMarkets.length} sub-markets
                </div>
              )}
            </div>
          </div>
          
          {market.resolved && (
            <div className="ml-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Resolved
              </span>
            </div>
          )}
        </div>

        {/* Outcomes */}
        <div className="flex-1 mb-4">
          <div className="space-y-2">
            {market.outcomes.map((outcome, index) => {
              const outcomeOdds = odds?.[outcome] || 1;
              const probability = calculateProbability(outcomeOdds);
              const isWinner = market.resolved && market.winningOutcome === outcome;
              
              return (
                <div
                  key={outcome}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isWinner
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isWinner ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span className={`font-medium ${
                      isWinner ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {outcome}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      isWinner ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {formatPercentage(probability)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {outcomeOdds.toFixed(2)}x
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewMarket(market.id)}
            className="flex-1"
          >
            View Details
          </Button>
          
          {!market.resolved && !isExpired && onPlaceBet && (
            <Button
              size="sm"
              onClick={() => onPlaceBet(market.id)}
              className="flex-1"
            >
              Place Bet
            </Button>
          )}
        </div>

        {/* Parent Market Link */}
        {market.parentMarketId && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => onViewMarket(market.parentMarketId!)}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              <GitBranch className="h-3 w-3 mr-1 rotate-180" />
              View parent market
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MarketCard;