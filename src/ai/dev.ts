import { config } from 'dotenv';
config();

import '@/ai/flows/voice-to-voice-question-flow.ts';
import '@/ai/flows/ai-counseling-prep.ts';
import '@/ai/flows/automated-interaction-report.ts';
import '@/ai/flows/speech-to-text-flow.ts';
import '@/ai/flows/text-to-speech-flow.ts';
import '@/ai/flows/live-counseling-flow.ts';
