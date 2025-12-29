
export enum InputMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  CAMERA = 'CAMERA'
}

export interface WhiteboardStep {
  text: string;
  color: 'blue' | 'black' | 'green' | 'yellow' | 'white';
}

export interface MathSolution {
  understanding: {
    rephrased: string;
    given: string[];
    required: string;
  };
  textSteps: string[];
  audioScript: string;
  whiteboardSteps: WhiteboardStep[];
  whiteboardAudioScript: string;
  drawingPrompt: string; // Prompt to generate a visual aid
  drawingAudioScript: string; // Text to be converted to speech explaining the drawing
  finalResult: {
    answer: string;
    encouragement: string;
  };
}

export interface AppState {
  isProcessing: boolean;
  isDrawingLoading: boolean;
  drawingUrl: string | null;
  solution: MathSolution | null;
  error: string | null;
  audioBlob: Blob | null;
  isAudioPlaying: boolean;
  previewImage: string | null;
  showWhiteboard: boolean;
  problemText: string;
  language: 'ar' | 'en';
}
