'use server';

/**
 * @fileOverview AI-powered counseling preparation flow.
 *
 * - aiCounselingPrep - A function that prepares counseling session by analyzing rowdy sheeter's profile.
 * - AICounselingPrepInput - The input type for the aiCounselingPrep function.
 * - AICounselingPrepOutput - The return type for the aiCounselingPrep function.
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

  const response = await fetchWithRetry(
    "http://localhost:8000/counsel/text",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: promptText,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Local API Error:", err);
    throw new Error(`Local API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  const textOutput = data.response_text;
  const detectedState = data.detected_state;

  if (!textOutput) {
    throw new Error("Empty or invalid response from Local API");
  }

  // Mocking the required JSON output based on the local model's simple text response
  const mockedOutput = {
    focusAreas: [
      `Detected State: ${detectedState}`,
      "Review the suggested actionable steps",
      "Assess immediate risk based on current mental state"
    ],
    suggestedQuestions: [
      textOutput,
      // Provide generic fallback questions in Telugu as requested by the original schema
      "మీరు ఇప్పుడు ఎలా భావిస్తున్నారు?", // How are you feeling now?
      "మనం దీని గురించి మరింత మాట్లాడగలమా?" // Can we talk more about this?
    ]
  };

  return AICounselingPrepOutputSchema.parse(mockedOutput);
}
