// Utility functions for the Fractal Protocol frontend

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind CSS class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Number formatting with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// Percentage formatting
export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Odds formatting (e.g., 1.5 -> "1.5x")
export function formatOdds(odds: number): string {
  return `${odds.toFixed(2)}x`;
}

// Calculate probability from odds
export function calculateProbability(odds: number): number {
  return 1 / odds;
}

// Time remaining formatting
export function formatTimeRemaining(expiryTime: Date): string {
  const now = new Date();
  const diff = expiryTime.getTime() - now.getTime();
  
  if (diff <= 0) {
    return 'Expired';
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Address truncation for display
export function truncateAddress(address: string, startLength = 6, endLength = 4): string {
  if (address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

// Generate unique market ID
export function generateMarketId(): string {
  return `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validation functions
export function validateMarketQuestion(question: string): string | null {
  if (!question.trim()) {
    return 'Market question is required';
  }
  if (question.length < 10) {
    return 'Market question must be at least 10 characters';
  }
  if (question.length > 200) {
    return 'Market question must be less than 200 characters';
  }
  return null;
}

export function validateMarketOutcomes(outcomes: string[]): string | null {
  if (outcomes.length < 2) {
    return 'At least 2 outcomes are required';
  }
  if (outcomes.length > 10) {
    return 'Maximum 10 outcomes allowed';
  }
  
  const validOutcomes = outcomes.filter(outcome => outcome.trim().length > 0);
  if (validOutcomes.length !== outcomes.length) {
    return 'All outcomes must have valid names';
  }
  
  const uniqueOutcomes = new Set(validOutcomes.map(o => o.toLowerCase()));
  if (uniqueOutcomes.size !== validOutcomes.length) {
    return 'All outcomes must be unique';
  }
  
  return null;
}

export function validateBetAmount(amount: number, balance: number, minBet = 1): string | null {
  if (amount <= 0) {
    return 'Bet amount must be greater than 0';
  }
  if (amount < minBet) {
    return `Minimum bet amount is ${formatCurrency(minBet)}`;
  }
  if (amount > balance) {
    return 'Insufficient balance';
  }
  return null;
}

// Utility functions for async operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}