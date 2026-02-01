'use server';

/**
 * @fileOverview AI-powered counseling preparation flow.
 *
 * - aiCounselingPrep - A function that prepares counseling session by analyzing rowdy sheeter's profile.
 * - AICounselingPrepInput - The input type for the aiCounselingPrep function.
 * - AICounselingPrepOutput - The return type for the aiCounselingPrep function.
 */

import {z} from 'zod';

const AICounselingPrepInputSchema = z.object({
  personalDetails: z.object({
    name: z.string().describe('The name of the rowdy sheeter.'),
    age: z.number().describe('The age of the rowdy sheeter.'),
    area: z.string().describe('The area of residence of the rowdy sheeter.'),
    id: z.string().describe('The unique identifier of the rowdy sheeter.'),
  }).describe('Personal details of the rowdy sheeter.'),
  criminalHistory: z.array(
    z.object({
      cases: z.string().describe('List of cases the sheeter has been involved in'),
      sections: z.string().describe('Legal sections applied to the sheeter'),
      frequency: z.string().describe('Frequency of offenses'),
    })
  ).describe('Criminal history of the rowdy sheeter.'),
  behavioralTags: z.array(z.string()).describe('Behavioral tags associated with the rowdy sheeter (e.g., violent, repeat offender, substance abuse).'),
  riskLevel: z.enum(['Low', 'Medium', 'High']).describe('Risk level of the rowdy sheeter.'),
  previousCounselingSummaries: z.array(z.string()).describe('Summaries of previous counseling sessions.'),
  voiceInteractionHistoryMetadata: z.array(
    z.object({
      date: z.string().describe('Date of the voice interaction.'),
      duration: z.string().describe('Duration of the voice interaction.'),
    })
  ).optional().describe('Metadata of previous voice interactions.'),
});

export type AICounselingPrepInput = z.infer<typeof AICounselingPrepInputSchema>;

const AICounselingPrepOutputSchema = z.object({
  focusAreas: z.array(z.string()).describe('Suggested focus areas for the counseling session.'),
  suggestedQuestions: z.array(z.string()).describe('Context-appropriate questions for the counseling session, in Telugu.'),
});

export type AICounselingPrepOutput = z.infer<typeof AICounselingPrepOutputSchema>;


function buildPrompt(input: AICounselingPrepInput): string {
  const criminalHistorySection = (input.criminalHistory && input.criminalHistory.length > 0)
    ? `- Cases:\n    ${input.criminalHistory.map(h => `- ${h.cases} (Sections: ${h.sections}, Frequency: ${h.frequency})`).join('\n    ')}`
    : '- No criminal history available.';

  const behavioralTagsSection = (input.behavioralTags && input.behavioralTags.length > 0)
    ? `- ${input.behavioralTags.join(', ')}`
    : '- No behavioral tags available.';

  const previousSummariesSection = (input.previousCounselingSummaries && input.previousCounselingSummaries.length > 0)
    ? `- ${input.previousCounselingSummaries.join('\n- ')}`
    : '- No previous counseling summaries available.';

  return `You are an AI assistant designed to help counselors prepare for counseling sessions with rowdy sheeters.
Analyze the provided rowdy sheeter profile and suggest focus areas and context-appropriate questions for the upcoming counseling session.
Consider the criminal history, behavioral tags, risk level, and previous counseling summaries to tailor your suggestions.

Rowdy Sheeter Profile:
----------------------
Personal Details:
- Name: ${input.personalDetails.name}
- Age: ${input.personalDetails.age}
- Area: ${input.personalDetails.area}
- ID: ${input.personalDetails.id}

Criminal History:
${criminalHistorySection}

Behavioral Tags:
${behavioralTagsSection}

Risk Level: ${input.riskLevel}

Previous Counseling Summaries:
${previousSummariesSection}

Based on this profile, suggest 3-5 focus areas in English, and 3-5 context-appropriate questions for the counseling session in Telugu.

Format your output as a JSON object that adheres to the defined schema.
`;
}


export async function aiCounselingPrep(input: AICounselingPrepInput): Promise<AICounselingPrepOutput> {
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
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
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

  try {
    const jsonOutput = JSON.parse(textOutput);
    return AICounselingPrepOutputSchema.parse(jsonOutput);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", textOutput);
    throw new Error("Invalid JSON response from AI.");
  }
}
