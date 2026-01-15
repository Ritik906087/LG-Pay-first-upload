'use server';
/**
 * @fileOverview A simple help chat AI agent.
 *
 * - helpChat - A function that handles the chat conversation.
 * - HelpChatInput - The input type for the helpChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HelpChatInputSchema = z.object({
  prompt: z.string().describe('The user\'s message or question.'),
});
export type HelpChatInput = z.infer<typeof HelpChatInputSchema>;

export async function helpChat(input: HelpChatInput): Promise<string> {
  const response = await helpChatFlow(input);
  return response;
}

const prompt = ai.definePrompt({
  name: 'helpChatPrompt',
  input: {schema: HelpChatInputSchema},
  prompt: `You are a helpful customer support agent for an application called LG Pay.
  Your goal is to answer the user's questions about the app.
  Be concise and helpful.

  User question: {{{prompt}}}`,
});

const helpChatFlow = ai.defineFlow(
  {
    name: 'helpChatFlow',
    inputSchema: HelpChatInputSchema,
    outputSchema: z.string(),
  },
  async input => {
    const {text} = await prompt(input);
    return text;
  }
);
