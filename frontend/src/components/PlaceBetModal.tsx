import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { Modal, Button, Input, Card } from './ui';
import type { Market, MarketOdds, PlaceBetForm } from '../types';
import { formatCurrency, formatPercentage, calculateProbability, validateBetAmount } from '../utils';

interface PlaceBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market | null;
  odds?: MarketOdds;
  userBalance: number;
  onPlaceBet: (form: PlaceBetForm) => Promise<void>;
}

const PlaceBetModal: React.FC<PlaceBetModalProps> = ({
  isOpen,
  onClose,
  market,
  odds,
  userBalance,
  onPlaceBet,
}) => {
  const [form, setForm] = useState<PlaceBetForm>({
    marketId: '',
    outcome: '',
    amount: 0,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (market) {
      setForm(prev => ({
        ...prev,
        marketId: market.id,
        outcome: prev.outcome || market.outcomes[0],
      }));
    }
  }, [market]);

  const handleInputChange = (field: keyof PlaceBetForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate amount
    const amountError = validateBetAmount(form.amount, userBalance);
    if (amountError) {
      newErrors.amount = amountError;
    }

    // Validate outcome selection
    if (!form.outcome) {
      newErrors.outcome = 'Please select an outcome';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onPlaceBet(form);
      onClose();
      // Reset form
      setForm({
        marketId: market?.id || '',
        outcome: market?.outcomes[0] || '',
        amount: 0,
      });
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to place bet'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!market) return null;

  const selectedOdds = odds?.[form.outcome] || 1;
  const probability = calculateProbability(selectedOdds);
  const potentialWinnings = form.amount * selectedOdds;
  const potentialProfit = potentialWinnings - form.amount;

  const quickAmounts = [10, 25, 50, 100].filter(amount => amount <= userBalance);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Place Bet"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Market Info */}
        <Card className="bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">{market.question}</h4>
          <div className="text-sm text-gray-600">
            Total Staked: {formatCurrency(market.totalStaked)}
          </div>
        </Card>

        {/* Outcome Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Outcome
          </label>
          <div className="space-y-2">
            {market.outcomes.map((outcome) => {
              const outcomeOdds = odds?.[outcome] || 1;
              const outcomeProb = calculateProbability(outcomeOdds);
              const isSelected = form.outcome === outcome;
              
              return (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => handleInputChange('outcome', outcome)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      isSelected ? 'text-primary-900' : 'text-gray-900'
                    }`}>
                      {outcome}
                    </span>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        isSelected ? 'text-primary-700' : 'text-gray-700'
                      }`}>
                        {formatPercentage(outcomeProb)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {outcomeOdds.toFixed(2)}x
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.outcome && (
            <p className="mt-1 text-sm text-red-600">{errors.outcome}</p>
          )}
        </div>

        {/* Bet Amount */}
        <div>
          <Input
            label="Bet Amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount || ''}
            onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            error={errors.amount}
            helperText={`Available balance: ${formatCurrency(userBalance)}`}
          />
          
          {/* Quick Amount Buttons */}
          {quickAmounts.length > 0 && (
            <div className="mt-2 flex space-x-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange('amount', amount)}
                  className="text-xs"
                >
                  ${amount}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Bet Summary */}
        {form.amount > 0 && form.outcome && (
          <Card className="bg-blue-50 border-blue-200">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Bet Amount:</span>
                <span className="font-medium">{formatCurrency(form.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Odds:</span>
                <span className="font-medium">{selectedOdds.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Probability:</span>
                <span className="font-medium">{formatPercentage(probability)}</span>
              </div>
              <div className="border-t border-blue-200 pt-2 flex justify-between">
                <span className="text-gray-600">Potential Winnings:</span>
                <span className="font-semibold text-blue-700">
                  {formatCurrency(potentialWinnings)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Potential Profit:</span>
                <span className="font-semibold text-green-600">
                  +{formatCurrency(potentialProfit)}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Warning */}
        <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>Risk Warning:</strong> Prediction markets involve risk. 
            Only bet what you can afford to lose.
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={form.amount <= 0 || !form.outcome}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Place Bet
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PlaceBetModal;