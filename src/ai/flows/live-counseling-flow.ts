'use server';

/**
 * @fileOverview A live AI counseling flow for interviewing sheeters.
 *
 * - liveCounseling - A function that conducts a live, conversational interview.
 * - LiveCounselingInput - The input type for the liveCounseling function.
 * - LiveCounselingOutput - The return type for the liveCounseling function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { textToSpeech } from './text-to-speech-flow';

const sheeterProfileSchema = z.object({
  personalDetails: z.object({
    name: z.string(),
    age: z.number(),
    area: z.string(),
  }),
  criminalHistory: z.array(z.object({
    cases: z.string(),
    sections: z.string(),
    frequency: z.string(),
  })),
  behavioralTags: z.array(z.string()),
  riskLevel: z.enum(['Low', 'Medium', 'High']),
});

const conversationMessageSchema = z.object({
  role: z.enum(['ai', 'sheeter']),
  content: z.string(),
});

const LiveCounselingInputSchema = z.object({
  sheeterProfile: sheeterProfileSchema,
  conversationHistory: z.array(conversationMessageSchema).describe("The history of the conversation so far."),
  latestSheeterMessage: z.string().describe("The latest message from the sheeter. If this is the start of the conversation, this might be an instruction like '[START_SESSION]'.")
});
export type LiveCounselingInput = z.infer<typeof LiveCounselingInputSchema>;

const LiveCounselingOutputSchema = z.object({
    responseText: z.string().describe("The AI counselor's response in the conversation, in Telugu."),
    audioDataUri: z.string(),
});
export type LiveCounselingOutput = z.infer<typeof LiveCounselingOutputSchema>;

export async function liveCounseling(input: LiveCounselingInput): Promise<LiveCounselingOutput> {
  return liveCounselingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'liveCounselingPrompt',
  input: { schema: z.object({
      sheeterProfile: sheeterProfileSchema,
      conversationHistory: z.string(), // We'll pass the formatted string here
      latestSheeterMessage: z.string(),
  }) },
  output: { schema: z.object({
      responseText: z.string().describe("The AI counselor's response in the conversation, in Telugu."),
  })},
  prompt: `You are an AI assistant acting as a professional counselor for a police department. You are conducting a live interview with a "rowdy sheeter". Your goal is to examine their current status and behavior by engaging in a conversation. The entire conversation MUST be in Telugu.

  Maintain an empathetic, neutral, and professional tone. Ask open-ended questions to encourage self-reflection. Do not be accusatory. Guide the conversation based on their profile and their responses. Keep your responses concise and conversational.

  If the latest message is '[START_SESSION]', begin the interview with a brief introduction and an opening question in Telugu.

  **Sheeter Profile:**
  - Name: {{{sheeterProfile.personalDetails.name}}}
  - Age: {{{sheeterProfile.personalDetails.age}}}
  - Area: {{{sheeterProfile.personalDetails.area}}}
  - Risk Level: {{{sheeterProfile.riskLevel}}}
  - Behavioral Tags: {{#each sheeterProfile.behavioralTags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - Criminal History: {{#each sheeterProfile.criminalHistory}}{{{this.cases}}}{{#unless @last}}, {{/unless}}{{/each}}

  **Conversation History:**
  {{{conversationHistory}}}

  **Sheeter's Latest Message:**
  {{{latestSheeterMessage}}}

  Generate your next response to the sheeter in Telugu. Format your output as a JSON object that adheres to the defined schema.
  `,
});

const liveCounselingFlow = ai.defineFlow(
  {
    name: 'liveCounselingFlow',
    inputSchema: LiveCounselingInputSchema,
    outputSchema: LiveCounselingOutputSchema,
  },
  async (input) => {
    const historyText = input.conversationHistory.map(msg => `${msg.role === 'ai' ? 'AI Counselor' : 'Sheeter'}: ${msg.content}`).join('\n');
    
    const promptInput = {
        sheeterProfile: input.sheeterProfile,
        conversationHistory: historyText,
        latestSheeterMessage: input.latestSheeterMessage,
    };

    const { output } = await prompt(promptInput);
    if (!output) {
        throw new Error('Failed to get response from AI.');
    }
    const { responseText } = output;

    const { audioDataUri } = await textToSpeech({ text: responseText });

    return {
      responseText,
      audioDataUri,
    };
  }
);
