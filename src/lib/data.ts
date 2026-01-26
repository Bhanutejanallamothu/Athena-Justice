import type { Sheeter } from './types';

export const sheeters: Sheeter[] = [
  {
    id: 'RS-001',
    personalDetails: {
      name: 'Ajay Kumar',
      age: 28,
      area: 'Marathahalli',
    },
    criminalHistory: [
      { cases: 'Assault, Extortion', sections: 'IPC 323, 384', frequency: 'Frequent' },
      { cases: 'Public Nuisance', sections: 'IPC 268', frequency: 'Occasional' },
    ],
    behavioralTags: ['violent', 'repeat offender', 'gang-affiliated'],
    riskLevel: 'High',
    previousCounselingSummaries: [
      'Session 1 (2023-01-15): Subject was defensive and uncooperative. Denied all allegations.',
      'Session 2 (2023-03-20): Showed slight improvement in attitude but still deflects responsibility.',
    ],
    voiceInteractionHistory: [
      { date: '2023-01-15', duration: '30min', sessionId: 'VI-001' },
      { date: '2023-03-20', duration: '45min', sessionId: 'VI-002' },
    ],
  },
  {
    id: 'RS-002',
    personalDetails: {
      name: 'Vijay Singh',
      age: 35,
      area: 'Whitefield',
    },
    criminalHistory: [
      { cases: 'Theft, Robbery', sections: 'IPC 379, 392', frequency: 'Recurrent' },
    ],
    behavioralTags: ['substance abuse', 'theft'],
    riskLevel: 'Medium',
    previousCounselingSummaries: [
      'Session 1 (2023-02-10): Subject admitted to substance abuse issues. Expressed desire for help.',
    ],
    voiceInteractionHistory: [
      { date: '2023-02-10', duration: '50min', sessionId: 'VI-003' },
    ],
  },
  {
    id: 'RS-003',
    personalDetails: {
      name: 'Sunita Devi',
      age: 22,
      area: 'Koramangala',
    },
    criminalHistory: [
      { cases: 'Petty Theft', sections: 'IPC 378', frequency: 'Once' },
    ],
    behavioralTags: ['first-time offender', 'financial distress'],
    riskLevel: 'Low',
    previousCounselingSummaries: [
      'Session 1 (2023-05-01): Subject was remorseful. Explained actions were due to financial hardship.',
    ],
    voiceInteractionHistory: [
      { date: '2023-05-01', duration: '25min', sessionId: 'VI-004' },
    ],
  },
  {
    id: 'RS-004',
    personalDetails: {
      name: 'Rakesh Sharma',
      age: 42,
      area: 'Marathahalli',
    },
    criminalHistory: [
      { cases: 'Fraud, Forgery', sections: 'IPC 420, 465', frequency: 'Occasional' },
    ],
    behavioralTags: ['white-collar', 'non-violent'],
    riskLevel: 'Medium',
    previousCounselingSummaries: [
      'Session 1 (2023-04-12): Subject is intelligent and manipulative. Consistently downplays actions.',
      'Session 2 (2023-06-01): Continues to show lack of empathy for victims.',
    ],
    voiceInteractionHistory: [
        { date: '2023-04-12', duration: '60min', sessionId: 'VI-005' },
        { date: '2023-06-01', duration: '55min', sessionId: 'VI-006' },
    ],
  },
  {
    id: 'RS-005',
    personalDetails: {
      name: 'Priya Verma',
      age: 25,
      area: 'Indiranagar',
    },
    criminalHistory: [
      { cases: 'Public Intoxication', sections: 'KP Act 92', frequency: 'Frequent' },
    ],
    behavioralTags: ['substance abuse', 'public nuisance'],
    riskLevel: 'Low',
    previousCounselingSummaries: [],
    voiceInteractionHistory: [],
  },
];

export function getSheeterById(id: string): Sheeter | undefined {
    return sheeters.find(sheeter => sheeter.id === id);
}
