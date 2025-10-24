import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Modal, Button, Input, Card } from './ui';
import { CreateMarketForm } from '../types';
import { validateMarketQuestion, validateOutcomes } from '../utils';

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMarket: (form: CreateMarketForm) => Promise<void>;
  parentMarketId?: string;
}

const CreateMarketModal: React.FC<CreateMarketModalProps> = ({
  isOpen,
  onClose,
  onCreateMarket,
  parentMarketId,
}) => {
  const [form, setForm] = useState<CreateMarketForm>({
    question: '',
    outcomes: ['', ''],
    expiryTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    parentMarketId,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof CreateMarketForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...form.outcomes];
    newOutcomes[index] = value;
    handleInputChange('outcomes', newOutcomes);
  };

  const addOutcome = () => {
    if (form.outcomes.length < 10) {
      handleInputChange('outcomes', [...form.outcomes, '']);
    }
  };

  const removeOutcome = (index: number) => {
    if (form.outcomes.length > 2) {
      const newOutcomes = form.outcomes.filter((_, i) => i !== index);
      handleInputChange('outcomes', newOutcomes);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate question
    const questionError = validateMarketQuestion(form.question);
    if (questionError) {
      newErrors.question = questionError;
    }

    // Validate outcomes
    const outcomesError = validateOutcomes(form.outcomes);
    if (outcomesError) {
      newErrors.outcomes = outcomesError;
    }

    // Validate expiry time
    if (form.expiryTime <= new Date()) {
      newErrors.expiryTime = 'Expiry time must be in the future';
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
      await onCreateMarket(form);
      onClose();
      // Reset form
      setForm({
        question: '',
        outcomes: ['', ''],
        expiryTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        parentMarketId,
      });
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create market'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDate = new Date();
  minDate.setHours(minDate.getHours() + 1); // At least 1 hour from now

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={parentMarketId ? 'Create Sub-Market' : 'Create New Market'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question */}
        <Input
          label="Market Question"
          value={form.question}
          onChange={(e) => handleInputChange('question', e.target.value)}
          placeholder="What will happen?"
          error={errors.question}
          helperText="Ask a clear, specific question that can be objectively resolved"
        />

        {/* Outcomes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Possible Outcomes
          </label>
          <div className="space-y-2">
            {form.outcomes.map((outcome, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={outcome}
                  onChange={(e) => handleOutcomeChange(index, e.target.value)}
                  placeholder={`Outcome ${index + 1}`}
                  className="flex-1"
                />
                {form.outcomes.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOutcome(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {form.outcomes.length < 10 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addOutcome}
              className="mt-2 text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Outcome
            </Button>
          )}
          
          {errors.outcomes && (
            <p className="mt-1 text-sm text-red-600">{errors.outcomes}</p>
          )}
        </div>

        {/* Expiry Time */}
        <Input
          label="Market Expiry"
          type="datetime-local"
          value={form.expiryTime.toISOString().slice(0, 16)}
          onChange={(e) => handleInputChange('expiryTime', new Date(e.target.value))}
          min={minDate.toISOString().slice(0, 16)}
          error={errors.expiryTime}
          helperText="When should this market close for new bets?"
        />

        {/* Parent Market Info */}
        {parentMarketId && (
          <Card className="bg-blue-50 border-blue-200">
            <div className="text-sm text-blue-800">
              <strong>Creating sub-market</strong>
              <p className="mt-1">
                This market will be linked to its parent market and may be automatically 
                created based on the parent market's resolution.
              </p>
            </div>
          </Card>
        )}

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
          >
            Create Market
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateMarketModal;