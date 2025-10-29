// proofreader.d.ts

declare interface ProofreaderOptions {
  expectedInputLanguages: string[];
  correctionExplanationLanguage?: string;
  // Other options like monitor, correctionExplanationLanguage, etc.
  // are likely here, but this is a minimum to silence the error.
}

declare interface ProofreadResult {
  correctedInput: string;
  // corrections array structure is more complex, but you can define it
  // as 'any' or a minimal structure for now.
  corrections: any[];
}

export interface ProofreaderInstance {
  // Methods of the instantiated object
  proofread(text: string): Promise<ProofreadResult>;
  destroy(): void;
}

declare interface ProofreaderStatic {
  // Static methods on the global object
  availability(): Promise<
    "available" | "downloadable" | "downloading" | "unavailable"
  >;
  create(options: ProofreaderOptions): Promise<ProofreaderInstance>;
}

// Declare the Proofreader as a global property on the window object
declare global {
  interface Window {
    Proofreader?: ProofreaderStatic;
  }
  const Proofreader: ProofreaderStatic;
}

export {}; // Important to make it a module and keep the global declaration
