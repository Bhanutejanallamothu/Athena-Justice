'use server';

/**
 * @fileOverview A speech-to-text flow for transcribing audio.
 *
 * - speechToText - A function that converts speech to text.
 * - SpeechToTextInput - The input type for the speechToText function.
 * - SpeechToTextOutput - The return type for the speechToText function.
 */

import {z} from 'zod';

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

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": process.env.GEMINI_API_KEY as string,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
            response_mime_type: "application/json",
        }
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
    throw new Error("Empty or invalid response from Gemini API for transcription");
  }

  try {
    const jsonOutput = JSON.parse(textOutput);
    return SpeechToTextOutputSchema.parse(jsonOutput);
  } catch (e) {
    console.error("Failed to parse Gemini transcription response as JSON:", textOutput);
    throw new Error("Invalid JSON response from AI for transcription.");
  }
}
