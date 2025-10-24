import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatOdds(odds: number): string {
  if (odds >= 2) {
    return `${odds.toFixed(1)}:1`;
  }
  return `1:${(1 / odds).toFixed(1)}`;
}

export function calculateProbability(odds: number): number {
  return 1 / odds;
}

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
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) {
    return address;
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function generateMarketId(): string {
  return `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateMarketQuestion(question: string): string | null {
  if (!question.trim()) {
    return 'Question is required';
  }
  if (question.length < 10) {
    return 'Question must be at least 10 characters long';
  }
  if (question.length > 200) {
    return 'Question must be less than 200 characters';
  }
  return null;
}

export function validateOutcomes(outcomes: string[]): string | null {
  if (outcomes.length < 2) {
    return 'At least 2 outcomes are required';
  }
  if (outcomes.length > 10) {
    return 'Maximum 10 outcomes allowed';
  }
  
  const uniqueOutcomes = new Set(outcomes.map(o => o.trim().toLowerCase()));
  if (uniqueOutcomes.size !== outcomes.length) {
    return 'All outcomes must be unique';
  }
  
  for (const outcome of outcomes) {
    if (!outcome.trim()) {
      return 'All outcomes must have text';
    }
    if (outcome.length > 50) {
      return 'Outcomes must be less than 50 characters';
    }
  }
  
  return null;
}

export function validateBetAmount(amount: number, balance: number): string | null {
  if (amount <= 0) {
    return 'Bet amount must be greater than 0';
  }
  if (amount > balance) {
    return 'Insufficient balance';
  }
  return null;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
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