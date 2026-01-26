import {createNextJsHandler} from '@genkit-ai/next';

// This is where all the Genkit flows are actually defined.
import '@/ai/dev';

export const maxDuration = 60; // This function can run for a maximum of 60 seconds

// By default, this will be served at `/api/genkit`.
export const {GET, POST} = createNextJsHandler();
