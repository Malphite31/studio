'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing AI-driven budget suggestions.
 *
 * The flow analyzes user income and expenses to generate personalized budget plans.
 * It includes the following:
 *   - suggestBudget: An asynchronous function that orchestrates the budget suggestion process.
 *   - SuggestBudgetInput: The input type for the suggestBudget function, defining the expected income and expense data.
 *   - SuggestBudgetOutput: The output type for the suggestBudget function, defining the structure of the budget suggestions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the budget suggestion flow.
const SuggestBudgetInputSchema = z.object({
  income: z.number().describe('The user monthly income.'),
  expenses: z
    .array(z.object({
      category: z.string().describe('The expense category.'),
      amount: z.number().describe('The expense amount for the category.'),
    }))
    .describe('An array of expenses with category and amount.'),
});
export type SuggestBudgetInput = z.infer<typeof SuggestBudgetInputSchema>;

// Define the output schema for the budget suggestion flow.
const SuggestBudgetOutputSchema = z.object({
  suggestedBudgets: z
    .array(z.object({
      category: z.string().describe('The expense category.'),
      suggestedAmount: z.number().describe('The suggested budget amount for the category.'),
    }))
    .describe('An array of suggested budgets with category and amount.'),
  summary: z.string().describe('A summary of the budget suggestions and key insights.'),
});
export type SuggestBudgetOutput = z.infer<typeof SuggestBudgetOutputSchema>;

// Wrapper function to call the flow
export async function suggestBudget(input: SuggestBudgetInput): Promise<SuggestBudgetOutput> {
  return suggestBudgetFlow(input);
}

// Define the prompt for generating budget suggestions.
const suggestBudgetPrompt = ai.definePrompt({
  name: 'suggestBudgetPrompt',
  input: {schema: SuggestBudgetInputSchema},
  output: {schema: SuggestBudgetOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's income and expenses and provide personalized budget suggestions.

  Income: {{{income}}}
  Expenses:
  {{#each expenses}}
  - Category: {{{category}}}, Amount: {{{amount}}}
  {{/each}}

  Based on this information, suggest a budget for each category and provide a summary of your suggestions and key insights. Ensure that the suggested budget aligns with the income and helps the user achieve their financial goals.
  Ensure the suggestedAmount is in the same currency as the income and expenses.
  Format the output as a JSON object that satisfies the schema requirements.`,
});

// Define the Genkit flow for generating budget suggestions.
const suggestBudgetFlow = ai.defineFlow(
  {
    name: 'suggestBudgetFlow',
    inputSchema: SuggestBudgetInputSchema,
    outputSchema: SuggestBudgetOutputSchema,
  },
  async input => {
    const {output} = await suggestBudgetPrompt(input);
    return output!;
  }
);
