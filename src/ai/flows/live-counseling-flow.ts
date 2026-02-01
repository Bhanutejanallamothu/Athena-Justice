'use server';

/**
 * @fileOverview A live AI counseling flow for interviewing sheeters.
 *
 * - liveCounseling - A function that conducts a live, conversational interview.
 * - LiveCounselingInput - The input type for the liveCounseling function.
 * - LiveCounselingOutput - The return type for the liveCounseling function.
 */

import {z} from 'zod';
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

  const response = await fetch(
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
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        ],
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

  let responseText: string;
  try {
    const jsonOutput = JSON.parse(textOutput);
    responseText = z.object({ responseText: z.string() }).parse(jsonOutput).responseText;
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", textOutput);
    throw new Error("Invalid JSON response from AI.");
  }

  const { audioDataUri } = await textToSpeech({ text: responseText });

  return {
    responseText,
    audioDataUri,
  };
}
