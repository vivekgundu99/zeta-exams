// src/lib/types.ts
export interface Question {
  _id: string;
  questionId: string;
  serialNumber: string;
  subject: string;
  chapter: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  questionImageUrl?: string;
  explanationImageUrl?: string;
}

export interface Formula {
  _id: string;
  subject: string;
  chapter: string;
  pdfUrl: string;
  shortNote?: string;
}

export interface MockTestQuestion {
  serialNumber: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  questionImageUrl?: string;
  explanationImageUrl?: string;
}

export interface MockTest {
  _id: string;
  testName: string;
  duration: number;
  totalQuestions: number;
  marking: {
    positive: number;
    negative: number;
  };
  questions: MockTestQuestion[];
  createdAt: string;
}

export interface MockTestAnswer {
  questionNumber: number;
  selectedOption: 'A' | 'B' | 'C' | 'D' | '';
}

export interface Admin {
  id: string;
  email: string;
}