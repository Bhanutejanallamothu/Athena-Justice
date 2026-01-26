'use server';

/**
 * @fileOverview AI-powered counseling preparation flow.
 *
 * - aiCounselingPrep - A function that prepares counseling session by analyzing rowdy sheeter's profile.
 * - AICounselingPrepInput - The input type for the aiCounselingPrep function.
 * - AICounselingPrepOutput - The return type for the aiCounselingPrep function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

export async function aiCounselingPrep(input: AICounselingPrepInput): Promise<AICounselingPrepOutput> {
  return aiCounselingPrepFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCounselingPrepPrompt',
  input: {schema: AICounselingPrepInputSchema},
  output: {schema: AICounselingPrepOutputSchema},
  prompt: `You are an AI assistant designed to help counselors prepare for counseling sessions with rowdy sheeters.
  Analyze the provided rowdy sheeter profile and suggest focus areas and context-appropriate questions for the upcoming counseling session.
  Consider the criminal history, behavioral tags, risk level, and previous counseling summaries to tailor your suggestions.

  Rowdy Sheeter Profile:
  ----------------------
  Personal Details:
  - Name: {{{personalDetails.name}}}
  - Age: {{{personalDetails.age}}}
  - Area: {{{personalDetails.area}}}
  - ID: {{{personalDetails.id}}}

  Criminal History:
  {{#if criminalHistory}}
  - Cases:
    {{#each criminalHistory}}
      - {{{this.cases}}} (Sections: {{{this.sections}}}, Frequency: {{{this.frequency}}})
    {{/each}}
  {{else}}
  - No criminal history available.
  {{/if}}

  Behavioral Tags:
  {{#if behavioralTags}}
  - {{#each behavioralTags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{else}}
  - No behavioral tags available.
  {{/if}}

  Risk Level: {{{riskLevel}}}

  Previous Counseling Summaries:
  {{#if previousCounselingSummaries}}
  - {{#each previousCounselingSummaries}}{{{this}}}{{#unless @last}}\n{{/unless}}{{/each}}
  {{else}}
  - No previous counseling summaries available.
  {{/if}}

  Based on this profile, suggest 3-5 focus areas in English, and 3-5 context-appropriate questions for the counseling session in Telugu.

  Format your output as a JSON object that adheres to the defined schema.
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const aiCounselingPrepFlow = ai.defineFlow(
  {
    name: 'aiCounselingPrepFlow',
    inputSchema: AICounselingPrepInputSchema,
    outputSchema: AICounselingPrepOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
