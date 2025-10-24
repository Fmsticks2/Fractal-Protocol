import { useState, useCallback, useEffect } from 'react';
import type { WalletState } from '../types';

// Mock Linera wallet implementation for development
class MockLineraWallet {
  private connected = false;
  private address = '';
  private balance = 0;
  private eventListeners: { [key: string]: Function[] } = {};

  async connect() {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.connected = true;
    this.address = '0x' + Math.random().toString(16).substr(2, 40);
    this.balance = Math.floor(Math.random() * 10000) + 1000;
    
    this.emit('connect', { address: this.address, balance: this.balance });
    return { address: this.address, balance: this.balance };
  }

  async disconnect() {
    this.connected = false;
    this.address = '';
    this.balance = 0;
    
    this.emit('disconnect');
  }

  async getBalance(_address: string) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.balance;
  }

  isConnected() {
    return this.connected;
  }

  getAddress() {
    return this.address;
  }

  getCurrentBalance() {
    return this.balance;
  }

  // Event handling methods (unused parameters are intentional for API compatibility)
  on(_event: string, _callback: Function) {
    // Mock implementation - parameters kept for interface compatibility
  }

  off(_event: string, _callback: Function) {
    // Mock implementation - parameters kept for interface compatibility
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners[event] || [];
    listeners.forEach(callback => callback(data));
  }
}

const mockLineraWallet = new MockLineraWallet();

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: undefined,
    balance: undefined,
    chainId: undefined,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (mockLineraWallet.isConnected()) {
          const address = mockLineraWallet.getAddress();
          const balance = mockLineraWallet.getCurrentBalance();
          
          if (address) {
            setWallet({
              connected: true,
              address,
              balance,
              chainId: 'linera-testnet',
            });
          }
        }
      } catch (err) {
        console.error('Failed to check wallet connection:', err);
      }
    };

    checkConnection();
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { address, balance } = await mockLineraWallet.connect();

      setWallet({
        connected: true,
        address,
        balance,
        chainId: 'linera-testnet',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await mockLineraWallet.disconnect();

      setWallet({
        connected: false,
        address: undefined,
        balance: undefined,
        chainId: undefined,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!wallet.connected || !wallet.address) {
      return;
    }

    try {
      const balance = mockLineraWallet.getCurrentBalance();
      setWallet(prev => ({ ...prev, balance }));
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  }, [wallet.connected, wallet.address]);

  // Set up wallet event listeners
  useEffect(() => {
    const handleConnect = (data: { address: string; balance: number }) => {
      setWallet({
        connected: true,
        address: data.address,
        balance: data.balance,
        chainId: 'linera-testnet',
      });
    };

    const handleDisconnect = () => {
      setWallet({
        connected: false,
        address: undefined,
        balance: undefined,
        chainId: undefined,
      });
    };

    // Add event listeners (mock implementation)
    mockLineraWallet.on('connect', handleConnect);
    mockLineraWallet.on('disconnect', handleDisconnect);

    return () => {
      // Remove event listeners
      mockLineraWallet.off('connect', handleConnect);
      mockLineraWallet.off('disconnect', handleDisconnect);
    };
  }, []);

  return {
    wallet,
    connect,
    disconnect,
    refreshBalance,
    isLoading,
    error,
  };
};