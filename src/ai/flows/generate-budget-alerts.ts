'use server';

/**
 * @fileOverview A flow for generating budget alerts based on user spending habits.
 *
 * - generateBudgetAlerts - A function that generates budget alerts.
 * - GenerateBudgetAlertsInput - The input type for the generateBudgetAlerts function.
 * - GenerateBudgetAlertsOutput - The return type for the generateBudgetAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBudgetAlertsInputSchema = z.object({
  budgetGoals: z.record(z.number()).describe('Monthly budget goals for each spending category.'),
  spending: z.record(z.number()).describe('Current spending in each category.'),
});
export type GenerateBudgetAlertsInput = z.infer<typeof GenerateBudgetAlertsInputSchema>;

const GenerateBudgetAlertsOutputSchema = z.object({
  alerts: z.array(z.string()).describe('A list of alerts based on budget goals and spending habits.'),
});
export type GenerateBudgetAlertsOutput = z.infer<typeof GenerateBudgetAlertsOutputSchema>;

export async function generateBudgetAlerts(input: GenerateBudgetAlertsInput): Promise<GenerateBudgetAlertsOutput> {
  return generateBudgetAlertsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBudgetAlertsPrompt',
  input: {schema: GenerateBudgetAlertsInputSchema},
  output: {schema: GenerateBudgetAlertsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's budget goals and spending habits to generate helpful alerts.

Budget Goals: {{budgetGoals}}
Spending: {{spending}}

Generate alerts if the user is approaching (80%) or exceeding (100%) their budget in any category. The alerts should be concise and actionable.

Format the alerts as a list of strings.
`,
});

const generateBudgetAlertsFlow = ai.defineFlow(
  {
    name: 'generateBudgetAlertsFlow',
    inputSchema: GenerateBudgetAlertsInputSchema,
    outputSchema: GenerateBudgetAlertsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
