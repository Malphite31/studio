'use server';

import {
  suggestBudget,
  type SuggestBudgetInput,
  type SuggestBudgetOutput,
} from '@/ai/flows/ai-budget-suggestions';
import {
  generateBudgetAlerts,
  type GenerateBudgetAlertsInput,
  type GenerateBudgetAlertsOutput,
} from '@/ai/flows/generate-budget-alerts';
import { z } from 'zod';

// Helper type for actions that can return data or an error
type ActionResult<T> = Promise<T | { error: string }>;

export async function getAiBudgetSuggestions(
  input: SuggestBudgetInput
): ActionResult<SuggestBudgetOutput> {
  try {
    const result = await suggestBudget(input);
    return result;
  } catch (error) {
    console.error('Error in getAiBudgetSuggestions:', error);
    return { error: 'Failed to generate AI budget suggestions. Please try again later.' };
  }
}

export async function getAiBudgetAlerts(
  input: GenerateBudgetAlertsInput
): ActionResult<GenerateBudgetAlertsOutput> {
  try {
    const result = await generateBudgetAlerts(input);
    return result;
  } catch (error) {
    console.error('Error in getAiBudgetAlerts:', error);
    return { error: 'Failed to generate AI insights. Please try again later.' };
  }
}
