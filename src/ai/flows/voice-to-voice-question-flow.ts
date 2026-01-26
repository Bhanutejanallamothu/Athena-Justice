'use server';
/**
 * @fileOverview A voice-to-voice question generation flow for counseling sessions.
 *
 * - generateQuestion - A function that generates a question based on the sheeter's profile and previous responses.
 * - VoiceToVoiceQuestionInput - The input type for the generateQuestion function.
 * - VoiceToVoiceQuestionOutput - The return type for the generateQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceToVoiceQuestionInputSchema = z.object({
  profileDetails: z
    .string()
    .describe('The personal details of the rowdy sheeter profile.'),
  criminalHistory: z
    .string()
    .describe('The criminal history of the rowdy sheeter.'),
  behavioralPatterns: z
    .string()
    .describe('The behavioral patterns of the rowdy sheeter.'),
  previousResponses: z
    .string()
    .describe('The previous counseling responses of the rowdy sheeter.'),
});
export type VoiceToVoiceQuestionInput = z.infer<typeof VoiceToVoiceQuestionInputSchema>;

const VoiceToVoiceQuestionOutputSchema = z.object({
  question: z.string().describe('The generated question for the counseling session.'),
});
export type VoiceToVoiceQuestionOutput = z.infer<typeof VoiceToVoiceQuestionOutputSchema>;

export async function generateQuestion(input: VoiceToVoiceQuestionInput): Promise<VoiceToVoiceQuestionOutput> {
  return voiceToVoiceQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'voiceToVoiceQuestionPrompt',
  input: {schema: VoiceToVoiceQuestionInputSchema},
  output: {schema: VoiceToVoiceQuestionOutputSchema},
  prompt: `You are an AI assistant designed to generate context-appropriate counseling questions based on the rowdy sheeter's profile and previous responses.

  Consider the following information about the rowdy sheeter:
  Profile Details: {{{profileDetails}}}
  Criminal History: {{{criminalHistory}}}
  Behavioral Patterns: {{{behavioralPatterns}}}
  Previous Responses: {{{previousResponses}}}

  Based on this information, generate a single, clear, and concise question that encourages the rowdy sheeter to reflect on their behavior and consider positive changes.
  The question should be open-ended and avoid leading the sheeter towards a specific answer. Focus on promoting self-awareness and personal responsibility.
  Ensure the question is neutral and professional, with no emotional manipulation or coercion.
  The question should be appropriate for a law enforcement setting and comply with ethical guidelines for AI use in counseling.
  Please only respond with the question, and nothing else.`,
});

const voiceToVoiceQuestionFlow = ai.defineFlow(
  {
    name: 'voiceToVoiceQuestionFlow',
    inputSchema: VoiceToVoiceQuestionInputSchema,
    outputSchema: VoiceToVoiceQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
