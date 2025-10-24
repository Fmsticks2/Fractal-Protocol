import React, { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Input, Button, Card } from './ui';
import MarketCard from './MarketCard';
import { Market, MarketOdds } from '../types';

interface MarketListProps {
  markets: Market[];
  odds: Record<string, MarketOdds>;
  onViewMarket: (marketId: string) => void;
  onPlaceBet: (marketId: string) => void;
  loading?: boolean;
}

type SortOption = 'newest' | 'oldest' | 'volume' | 'expiry';
type FilterOption = 'all' | 'active' | 'resolved' | 'expiring';

const MarketList: React.FC<MarketListProps> = ({
  markets,
  odds,
  onViewMarket,
  onPlaceBet,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = markets;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(market =>
        market.question.toLowerCase().includes(query) ||
        market.outcomes.some(outcome => outcome.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'active':
        filtered = filtered.filter(market => !market.resolved && new Date() <= market.expiryTime);
        break;
      case 'resolved':
        filtered = filtered.filter(market => market.resolved);
        break;
      case 'expiring':
        const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        filtered = filtered.filter(market => 
          !market.resolved && 
          market.expiryTime <= oneDayFromNow && 
          market.expiryTime > new Date()
        );
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'newest':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'oldest':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'volume':
          comparison = b.totalStaked - a.totalStaked;
          break;
        case 'expiry':
          comparison = new Date(a.expiryTime).getTime() - new Date(b.expiryTime).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }, [markets, searchQuery, sortBy, filterBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search />}
          />

          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex space-x-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'active', label: 'Active' },
                  { key: 'resolved', label: 'Resolved' },
                  { key: 'expiring', label: 'Expiring Soon' },
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={filterBy === key ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterBy(key as FilterOption)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="volume">Volume</option>
                <option value="expiry">Expiry Date</option>
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSortOrder}
                className="p-1"
              >
                {sortOrder === 'desc' ? (
                  <SortDesc className="h-4 w-4" />
                ) : (
                  <SortAsc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredAndSortedMarkets.length} market{filteredAndSortedMarkets.length !== 1 ? 's' : ''} found
        </p>
        
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </Button>
        )}
      </div>

      {/* Market Grid */}
      {filteredAndSortedMarkets.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No markets found' : 'No markets available'}
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search terms or filters'
              : 'Create the first market to get started'
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedMarkets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              odds={odds[market.id]}
              onViewMarket={onViewMarket}
              onPlaceBet={onPlaceBet}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketList;