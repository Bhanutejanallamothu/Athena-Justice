'use server';

/**
 * @fileOverview This file defines the automated interaction report flow.
 *
 * - automatedInteractionReport - A function that generates an interaction report after a counseling session.
 * - AutomatedInteractionReportInput - The input type for the automatedInteractionReport function.
 * - AutomatedInteractionReportOutput - The return type for the automatedInteractionReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomatedInteractionReportInputSchema = z.object({
  criminalHistory: z.string().describe('The criminal history of the rowdy sheeter.'),
  behavioralPatterns: z.string().describe('The behavioral patterns of the rowdy sheeter.'),
  previousCounselingResponses: z.string().describe('The previous counseling responses of the rowdy sheeter.'),
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

export async function automatedInteractionReport(input: AutomatedInteractionReportInput): Promise<AutomatedInteractionReportOutput> {
  return automatedInteractionReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'automatedInteractionReportPrompt',
  input: {schema: AutomatedInteractionReportInputSchema},
  output: {schema: AutomatedInteractionReportOutputSchema},
  prompt: `You are an AI assistant that generates interaction reports after counseling sessions with rowdy sheeters.

  Based on the criminal history, behavioral patterns, previous counseling responses, and the current session transcript, generate a comprehensive interaction report.

  Include emotional indicators, cooperation level, behavioral change trend, risk level reassessment, a session summary, and recommended next action. Ensure the report is detailed and provides actionable insights for the counselor.

  Criminal History: {{{criminalHistory}}}
  Behavioral Patterns: {{{behavioralPatterns}}}
  Previous Counseling Responses: {{{previousCounselingResponses}}}
  Session Transcript: {{{sessionTranscript}}}

  Output the following fields, in JSON format:
  - emotionalIndicators: The emotional indicators observed during the session (e.g., calm, aggressive, defensive).
  - cooperationLevel: The level of cooperation exhibited by the rowdy sheeter during the session.
  - behavioralChangeTrend: The trend in behavioral change observed based on previous sessions.
  - riskLevelReassessment: A reassessment of the rowdy sheeter’s risk level based on the session.
  - sessionSummary: A summary of the key points and outcomes of the counseling session.
  - recommendedNextAction: Recommended next steps such as further counseling, monitoring, referral to rehabilitation, or legal escalation.
  `,
});

const automatedInteractionReportFlow = ai.defineFlow(
  {
    name: 'automatedInteractionReportFlow',
    inputSchema: AutomatedInteractionReportInputSchema,
    outputSchema: AutomatedInteractionReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
