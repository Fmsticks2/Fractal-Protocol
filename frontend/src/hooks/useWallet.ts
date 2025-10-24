import { useState, useEffect, useCallback } from 'react';
import { WalletState } from '../types';

// Mock Linera wallet interface - replace with actual Linera SDK integration
interface LineraWallet {
  connect(): Promise<{ address: string; chainId: string }>;
  disconnect(): Promise<void>;
  getBalance(address: string): Promise<number>;
  isConnected(): boolean;
  getAddress(): string | null;
  getChainId(): string | null;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}

// Mock implementation - replace with actual Linera wallet
const mockLineraWallet: LineraWallet = {
  async connect() {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'linera-testnet',
    };
  },
  
  async disconnect() {
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  
  async getBalance(address: string) {
    // Mock balance
    return 1000.50;
  },
  
  isConnected() {
    return localStorage.getItem('wallet_connected') === 'true';
  },
  
  getAddress() {
    return localStorage.getItem('wallet_address');
  },
  
  getChainId() {
    return localStorage.getItem('wallet_chainId');
  },
  
  on(event: string, callback: Function) {
    // Mock event listener
  },
  
  off(event: string, callback: Function) {
    // Mock event listener removal
  },
};

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
          const chainId = mockLineraWallet.getChainId();
          
          if (address && chainId) {
            const balance = await mockLineraWallet.getBalance(address);
            setWallet({
              connected: true,
              address,
              balance,
              chainId,
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
      const { address, chainId } = await mockLineraWallet.connect();
      const balance = await mockLineraWallet.getBalance(address);

      // Store connection state
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_address', address);
      localStorage.setItem('wallet_chainId', chainId);

      setWallet({
        connected: true,
        address,
        balance,
        chainId,
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

      // Clear connection state
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('wallet_chainId');

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
      const balance = await mockLineraWallet.getBalance(wallet.address);
      setWallet(prev => ({ ...prev, balance }));
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  }, [wallet.connected, wallet.address]);

  // Set up wallet event listeners
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        // Handle account change
        refreshBalance();
      }
    };

    const handleChainChanged = (chainId: string) => {
      setWallet(prev => ({ ...prev, chainId }));
    };

    const handleDisconnect = () => {
      disconnect();
    };

    // Add event listeners (mock implementation)
    mockLineraWallet.on('accountsChanged', handleAccountsChanged);
    mockLineraWallet.on('chainChanged', handleChainChanged);
    mockLineraWallet.on('disconnect', handleDisconnect);

    return () => {
      // Remove event listeners
      mockLineraWallet.off('accountsChanged', handleAccountsChanged);
      mockLineraWallet.off('chainChanged', handleChainChanged);
      mockLineraWallet.off('disconnect', handleDisconnect);
    };
  }, [disconnect, refreshBalance]);

  return {
    wallet,
    connect,
    disconnect,
    refreshBalance,
    isLoading,
    error,
  };
};