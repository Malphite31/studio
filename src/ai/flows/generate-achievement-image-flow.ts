'use server';
/**
 * @fileOverview A Genkit flow for generating a shareable image for an unlocked achievement.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateAchievementImageInputSchema = z.object({
  achievementTitle: z.string().describe('The title of the achievement that was unlocked.'),
  achievementDescription: z.string().describe('The description of the achievement.'),
  userName: z.string().describe("The name of the user who unlocked the achievement."),
  iconName: z.string().describe('The name of the Lucide icon associated with the achievement.'),
});

const GenerateAchievementImageOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the generated image. Expected format: 'data:image/png;base64,<encoded_data>'."),
});

export type GenerateAchievementImageInput = z.infer<typeof GenerateAchievementImageInputSchema>;
export type GenerateAchievementImageOutput = z.infer<typeof GenerateAchievementImageOutputSchema>;

export async function generateAchievementImage(input: GenerateAchievementImageInput): Promise<GenerateAchievementImageOutput> {
  return generateAchievementImageFlow(input);
}

const generateAchievementImageFlow = ai.defineFlow(
  {
    name: 'generateAchievementImageFlow',
    inputSchema: GenerateAchievementImageInputSchema,
    outputSchema: GenerateAchievementImageOutputSchema,
  },
  async (input) => {
    const prompt = `
      Generate a visually stunning, high-quality, vibrant, and celebratory image to be shared on social media for unlocking a financial achievement.

      The image should be square (1:1 aspect ratio).

      Key elements to include:
      1.  **Main Theme**: The central theme should be inspired by the achievement: "${input.achievementTitle}".
          The description for context is: "${input.achievementDescription}".
          The associated icon is named "${input.iconName}". Use the concept of this icon heavily in the visual theme.
      2.  **User's Name**: Prominently feature the name "${input.userName}" on the image.
      3.  **Achievement Title**: Display the text "Achievement Unlocked: ${input.achievementTitle}" clearly.
      4.  **App Name**: Subtly include the app name "PennyWise" or its logo (a coin with a 'P').
      5.  **Aesthetics**: The style should be modern, sleek, and celebratory. Use a mix of abstract geometric shapes, gradients, and a feeling of motion or explosion to signify accomplishment. Use a color palette that includes shades of orange, yellow, and gold to align with the "PennyWise" brand, but feel free to introduce other complementary colors for visual pop.
      
      Do not include any text other than the user's name, the achievement title, and the app name. The image should be purely graphical and celebratory otherwise.
    `;

    const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: prompt,
        config: {
            responseMimeType: 'image/png'
        }
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to produce an image.');
    }

    return {
      imageUrl: media.url,
    };
  }
);
