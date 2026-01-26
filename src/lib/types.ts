export type Sheeter = {
  id: string;
  personalDetails: {
    name: string;
    age: number;
    area: string;
  };
  criminalHistory: {
    cases: string;
    sections: string;
    frequency: string;
  }[];
  behavioralTags: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  previousCounselingSummaries: string[];
  voiceInteractionHistory: {
    date: string;
    duration: string;
    sessionId: string;
  }[];
};
