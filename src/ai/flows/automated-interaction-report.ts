'use server';

/**
 * @fileOverview This file defines the automated interaction report flow.
 *
 * - automatedInteractionReport - A function that generates an interaction report after a counseling session.
 * - AutomatedInteractionReportInput - The input type for the automatedInteractionReport function.
 * - AutomatedInteractionReportOutput - The return type for the automatedInteractionReport function.
 */

import { z } from 'zod';

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

  // Mocking the required JSON output
  const mockedOutput = {
    emotionalIndicators: detectedState || "Unknown",
    cooperationLevel: "Moderate (Standard Fallback)",
    behavioralChangeTrend: "Stable (Standard Fallback)",
    riskLevelReassessment: "Pending further review",
    sessionSummary: textOutput,
    recommendedNextAction: "Continue standard monitoring and support as guided by the counselor text."
  };

  return AutomatedInteractionReportOutputSchema.parse(mockedOutput);
}
