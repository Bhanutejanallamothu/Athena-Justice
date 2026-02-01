'use server';

/**
 * @fileOverview A text-to-speech flow for converting text to audio.
 *
 * - textToSpeech - A function that converts text to speech.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {z} from 'zod';
import wav from 'wav';

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

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The generated audio, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:audio/wav;base64,<encoded_data>'."
    ),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  if (!input.text?.trim()) {
    // Return a short silent WAV file if there's no text.
    return { audioDataUri: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA' };
  }

  const response = await fetchWithRetry(
    'https://texttospeech.googleapis.com/v1/text:synthesize',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY as string,
      },
      body: JSON.stringify({
        input: {
          text: input.text,
        },
        voice: {
          languageCode: 'te-IN',
        },
        audioConfig: {
          audioEncoding: 'LINEAR16',
          sampleRateHertz: 24000,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error('Google Text-to-Speech API Error:', err);
    throw new Error(`Google TTS API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  const pcmBase64 = data.audioContent;

  if (!pcmBase64) {
    throw new Error('No audio content returned from TTS API');
  }

  const audioBuffer = Buffer.from(pcmBase64, 'base64');
  const wavBase64 = await toWav(audioBuffer);

  return {
    audioDataUri: 'data:audio/wav;base64,' + wavBase64,
  };
}
