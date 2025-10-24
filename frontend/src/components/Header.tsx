import React from 'react';
import { GitBranch, Plus, BarChart3 } from 'lucide-react';
import { Button } from './ui';
import WalletConnection from './WalletConnection';
import { WalletState } from '../types';

interface HeaderProps {
  wallet: WalletState;
  onConnectWallet: () => Promise<void>;
  onDisconnectWallet: () => void;
  onCreateMarket: () => void;
  currentView: 'markets' | 'tree';
  onViewChange: (view: 'markets' | 'tree') => void;
}

const Header: React.FC<HeaderProps> = ({
  wallet,
  onConnectWallet,
  onDisconnectWallet,
  onCreateMarket,
  currentView,
  onViewChange,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Fractal Protocol</h1>
                <p className="text-xs text-gray-500">AI-Enhanced Prediction Markets</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewChange('markets')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'markets'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Markets</span>
              </button>
              <button
                onClick={() => onViewChange('tree')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'tree'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <GitBranch className="h-4 w-4" />
                <span>Tree View</span>
              </button>
            </div>

            {/* Create Market Button */}
            {wallet.connected && (
              <Button
                onClick={onCreateMarket}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Market</span>
              </Button>
            )}

            {/* Wallet Connection */}
            <WalletConnection
              wallet={wallet}
              onConnect={onConnectWallet}
              onDisconnect={onDisconnectWallet}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;