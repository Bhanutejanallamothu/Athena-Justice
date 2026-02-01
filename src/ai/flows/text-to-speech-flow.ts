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

  const response = await fetch(
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
