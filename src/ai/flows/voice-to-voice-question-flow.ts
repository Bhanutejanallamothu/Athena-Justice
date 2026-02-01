'use server';
/**
 * @fileOverview A voice-to-voice question generation flow for counseling sessions.
 *
 * - generateQuestion - A function that generates a question based on the sheeter's profile and previous responses.
 * - VoiceToVoiceQuestionInput - The input type for the generateQuestion function.
 * - VoiceToVoiceQuestionOutput - The return type for the generateQuestion function.
 */

import {z} from 'zod';

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

function buildPrompt(input: VoiceToVoiceQuestionInput): string {
    return `You are an AI assistant designed to generate context-appropriate counseling questions based on the rowdy sheeter's profile and previous responses.

Consider the following information about the rowdy sheeter:
Profile Details: ${input.profileDetails}
Criminal History: ${input.criminalHistory}
Behavioral Patterns: ${input.behavioralPatterns}
Previous Responses: ${input.previousResponses}

Based on this information, generate a single, clear, and concise question that encourages the rowdy sheeter to reflect on their behavior and consider positive changes.
The question should be open-ended and avoid leading the sheeter towards a specific answer. Focus on promoting self-awareness and personal responsibility.
Ensure the question is neutral and professional, with no emotional manipulation or coercion.
The question should be appropriate for a law enforcement setting and comply with ethical guidelines for AI use in counseling.

Your response should be a JSON object with a single key "question" containing the generated question.`;
}

export async function generateQuestion(input: VoiceToVoiceQuestionInput): Promise<VoiceToVoiceQuestionOutput> {
    const promptText = buildPrompt(input);

    const response = await fetchWithRetry(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY as string,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            response_mime_type: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
        const err = await response.text();
        console.error("Gemini API Error:", err);
        throw new Error(`Gemini API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
        throw new Error("Empty or invalid response from Gemini API");
    }

    try {
        const jsonOutput = JSON.parse(textOutput);
        return VoiceToVoiceQuestionOutputSchema.parse(jsonOutput);
    } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", textOutput);
        throw new Error("Invalid JSON response from AI.");
    }
}
