'use server';

/**
 * @fileOverview A speech-to-text flow for transcribing audio.
 *
 * - speechToText - A function that converts speech to text.
 * - SpeechToTextInput - The input type for the speechToText function.
 * - SpeechToTextOutput - The return type for the speechToText function.
 */

import { z } from 'zod';
import { Buffer } from 'buffer';

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

const SpeechToTextInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A recording of speech, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
  transcript: z.string().describe('The transcribed text from the audio, in Telugu.'),
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;

export async function speechToText(input: SpeechToTextInput): Promise<SpeechToTextOutput> {
  const promptText = 'Transcribe the following audio. The audio is in Telugu. Only return the transcribed text in Telugu script in a JSON object with a single "transcript" key.';

  const match = input.audioDataUri.match(/data:(.*);base64,(.*)/);
  if (!match) {
    throw new Error('Invalid audioDataUri format');
  }
  const [, mimeType, base64Data] = match;

  const formData = new FormData();
  // Using Blob requires Node >= 18 for native Blob API
  // Convert base64 string to buffer then blob
  const buffer = Buffer.from(base64Data, 'base64');
  const blob = new Blob([buffer], { type: mimeType });
  formData.append('audio_file', blob, 'audio.wav');

  const response = await fetchWithRetry(
    "http://localhost:8000/counsel/audio",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Local API Error:", err);
    throw new Error(`Local API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  const transcript = data.transcript;

  if (!transcript && transcript !== "") {
    throw new Error("Empty or invalid response from Local API for transcription");
  }

  return { transcript };
}
