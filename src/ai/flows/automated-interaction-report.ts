'use server';

/**
 * @fileOverview This file defines the automated interaction report flow.
 *
 * - automatedInteractionReport - A function that generates an interaction report after a counseling session.
 * - AutomatedInteractionReportInput - The input type for the automatedInteractionReport function.
 * - AutomatedInteractionReportOutput - The return type for the automatedInteractionReport function.
 */

import {z} from 'zod';

const AutomatedInteractionReportInputSchema = z.object({
  criminalHistory: z.array(
    z.object({
      cases: z.string(),
      sections: z.string(),
      frequency: z.string(),
    })
  ).describe('Criminal history of the rowdy sheeter.'),
  behavioralPatterns: z.array(z.string()).describe('The behavioral patterns of the rowdy sheeter.'),
  previousCounselingResponses: z.array(z.string()).describe('The previous counseling responses of the rowdy sheeter.'),
  sessionTranscript: z.string().describe('The transcript of the current counseling session.'),
});
export type AutomatedInteractionReportInput = z.infer<typeof AutomatedInteractionReportInputSchema>;

const AutomatedInteractionReportOutputSchema = z.object({
  emotionalIndicators: z.string().describe('The emotional indicators observed during the session (e.g., calm, aggressive, defensive).'),
  cooperationLevel: z.string().describe('The level of cooperation exhibited by the rowdy sheeter during the session.'),
  behavioralChangeTrend: z.string().describe('The trend in behavioral change observed based on previous sessions.'),
  riskLevelReassessment: z.string().describe('A reassessment of the rowdy sheeter’s risk level based on the session.'),
  sessionSummary: z.string().describe('A summary of the key points and outcomes of the counseling session.'),
  recommendedNextAction: z.string().describe('Recommended next steps such as further counseling, monitoring, referral to rehabilitation, or legal escalation.'),
});
export type AutomatedInteractionReportOutput = z.infer<typeof AutomatedInteractionReportOutputSchema>;


function buildPrompt(input: AutomatedInteractionReportInput): string {
    const criminalHistorySection = input.criminalHistory.map(h => `- Case: ${h.cases}, Sections: ${h.sections}, Frequency: ${h.frequency}`).join('\n');
    const behavioralPatternsSection = input.behavioralPatterns.map(p => `- ${p}`).join('\n');
    const previousResponsesSection = input.previousCounselingResponses.map(r => `- ${r}`).join('\n');

    return `You are an AI assistant that generates interaction reports after counseling sessions with rowdy sheeters.

Based on the criminal history, behavioral patterns, previous counseling responses, and the current session transcript, generate a comprehensive interaction report.

Your analysis should cover emotional indicators, cooperation level, behavioral change trend, risk level reassessment, a session summary, and a recommended next action. The report must be detailed and provide actionable insights for the counselor.

Criminal History:
${criminalHistorySection}

Behavioral Patterns:
${behavioralPatternsSection}

Previous Counseling Responses:
${previousResponsesSection}

Session Transcript: ${input.sessionTranscript}

Format your output as a JSON object that adheres to the defined schema.
`;
}


export async function automatedInteractionReport(input: AutomatedInteractionReportInput): Promise<AutomatedInteractionReportOutput> {
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
    return AutomatedInteractionReportOutputSchema.parse(jsonOutput);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", textOutput);
    throw new Error("Invalid JSON response from AI.");
  }
}
