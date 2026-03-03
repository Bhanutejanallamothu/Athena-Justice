'use server';

/**
 * @fileOverview A live AI counseling flow for interviewing sheeters.
 *
 * - liveCounseling - A function that conducts a live, conversational interview.
 * - LiveCounselingInput - The input type for the liveCounseling function.
 * - LiveCounselingOutput - The return type for the liveCounseling function.
 */

import { z } from 'zod';
import { textToSpeech } from './text-to-speech-flow';

// Helper functions for retry logic
const MAX_RETRIES = 4;
async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        let waitTime = Math.pow(2, i) * 500 + Math.random() * 100; // Exponential backoff with jitter

        const retryAfterHeader = response.headers.get('Retry-After');
        if (retryAfterHeader) {
          const retryAfterSeconds = parseInt(retryAfterHeader, 10);
          if (!isNaN(retryAfterSeconds)) {
            waitTime = retryAfterSeconds * 1000;
          }
        }

        console.warn(`API rate limited. Retrying in ${waitTime.toFixed(0)}ms... (Attempt ${i + 1}/${MAX_RETRIES})`);
        await sleep(waitTime);
        lastError = new Error(`Request failed with status ${response.status}.`);
        continue;
      }

      return response;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const waitTime = Math.pow(2, i) * 500 + Math.random() * 100;
      console.warn(`Fetch failed. Retrying in ${waitTime.toFixed(0)}ms... (Attempt ${i + 1}/${MAX_RETRIES})`, error);
      await sleep(waitTime);
    }
  }

  throw lastError ?? new Error(`Request failed after ${MAX_RETRIES} retries.`);
}

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


function buildPrompt(input: LiveCounselingInput): string {
  const historyText = input.conversationHistory.map(msg => `${msg.role === 'ai' ? 'AI Counselor' : 'Sheeter'}: ${msg.content}`).join('\n');

  return `You are an AI assistant acting as a professional counselor for a police department. You are conducting a live interview with a "rowdy sheeter". Your goal is to examine their current status and behavior by engaging in a conversation. The entire conversation MUST be in Telugu.

IMPORTANT: You are a supportive tool and not a replacement for professional medical or legal advice. Your role is to facilitate conversation.

Maintain an empathetic, neutral, and professional tone. Ask open-ended questions to encourage self-reflection. Do not be accusatory. Guide the conversation based on their profile and their responses. Keep your responses concise and conversational.

If the latest message is '[START_SESSION]', begin the interview with a brief introduction and an opening question in Telugu.

**Sheeter Profile:**
- Name: ${input.sheeterProfile.personalDetails.name}
- Age: ${input.sheeterProfile.personalDetails.age}
- Area: ${input.sheeterProfile.personalDetails.area}
- Risk Level: ${input.sheeterProfile.riskLevel}
- Behavioral Tags: ${input.sheeterProfile.behavioralTags.join(', ')}
- Criminal History: ${input.sheeterProfile.criminalHistory.map(h => h.cases).join(', ')}

**Conversation History:**
${historyText}

**Sheeter's Latest Message:**
${input.latestSheeterMessage}

Generate your next response to the sheeter in Telugu. Format your output as a JSON object with a single "responseText" field.
`;
}


export async function liveCounseling(input: LiveCounselingInput): Promise<LiveCounselingOutput> {
  const promptText = buildPrompt(input);

  const response = await fetchWithRetry(
    "http://localhost:8000/counsel/text",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: input.latestSheeterMessage || "[START_SESSION]",
        history: input.conversationHistory.map((msg: any) => ({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        })),
        sheeter_profile: input.sheeterProfile
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Local API Error:", err);
    throw new Error(`Local API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  const responseText = data.response_text;

  // The local python model returns response_audio_wav_base64 directly (which is now MP3 from gTTS)
  const audioDataUri = `data:audio/mp3;base64,${data.response_audio_wav_base64}`;

  if (!responseText) {
    throw new Error("Empty or invalid response from Local API");
  }

  return {
    responseText,
    audioDataUri,
  };
}
