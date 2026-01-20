// src/store/mockTestStore.ts
import { create } from 'zustand';
import { MockTestAnswer } from '@/lib/types';

interface MockTestState {
  currentTestId: string | null;
  answers: MockTestAnswer[];
  startTime: number | null;
  flaggedQuestions: Set<number>;
  setTestId: (id: string) => void;
  setAnswer: (questionNumber: number, selectedOption: 'A' | 'B' | 'C' | 'D' | '') => void;
  toggleFlag: (questionNumber: number) => void;
  startTest: () => void;
  resetTest: () => void;
  getAnswer: (questionNumber: number) => MockTestAnswer | undefined;
}

export const useMockTestStore = create<MockTestState>((set, get) => ({
  currentTestId: null,
  answers: [],
  startTime: null,
  flaggedQuestions: new Set(),
  
  setTestId: (id) => set({ currentTestId: id }),
  
  setAnswer: (questionNumber, selectedOption) => set((state) => {
    const existingIndex = state.answers.findIndex(a => a.questionNumber === questionNumber);
    const newAnswers = [...state.answers];
    
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = { questionNumber, selectedOption };
    } else {
      newAnswers.push({ questionNumber, selectedOption });
    }
    
    return { answers: newAnswers };
  }),
  
  toggleFlag: (questionNumber) => set((state) => {
    const newFlagged = new Set(state.flaggedQuestions);
    if (newFlagged.has(questionNumber)) {
      newFlagged.delete(questionNumber);
    } else {
      newFlagged.add(questionNumber);
    }
    return { flaggedQuestions: newFlagged };
  }),
  
  startTest: () => set({ startTime: Date.now() }),
  
  resetTest: () => set({
    currentTestId: null,
    answers: [],
    startTime: null,
    flaggedQuestions: new Set(),
  }),
  
  getAnswer: (questionNumber) => {
    const state = get();
    return state.answers.find(a => a.questionNumber === questionNumber);
  },
}));