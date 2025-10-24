import React, { useState, useEffect } from 'react';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { Button, Card } from './ui';
import { truncateAddress, formatCurrency } from '../utils';
import { WalletState } from '../types';

interface WalletConnectionProps {
  wallet: WalletState;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({
  wallet,
  onConnect,
  onDisconnect,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await onConnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setError(null);
  };

  if (!wallet.connected) {
    return (
      <Card className="max-w-md mx-auto">
        <div className="text-center">
          <Wallet className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600 mb-6">
            Connect your Linera wallet to start trading on prediction markets
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <Button
            onClick={handleConnect}
            loading={isConnecting}
            className="w-full"
          >
            Connect Linera Wallet
          </Button>
          
          <p className="text-xs text-gray-500 mt-4">
            Make sure you have the Linera wallet extension installed
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-gray-700">
          {truncateAddress(wallet.address!)}
        </span>
      </div>
      
      {wallet.balance !== undefined && (
        <div className="text-sm text-gray-600">
          Balance: {formatCurrency(wallet.balance)}
        </div>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDisconnect}
        className="text-gray-500 hover:text-gray-700"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default WalletConnection;