// language-model.d.ts

interface LanguageModelStatic {
  /** Checks the availability status of the language model. */
  availability(
    options?: LanguageModelOptions
  ): Promise<"available" | "downloadable" | "downloading" | "unavailable">;

  /** Returns the language model's default and maximum parameters. */
  params(): Promise<LanguageModelParams>;

  /** Creates a new conversation session with the language model. */
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelInstance>;
}

export interface LanguageModelInstance {
  /** Sends a prompt and waits for the full text response. */
  prompt(prompt: any[], options?: LanguageModelPromptOptions): Promise<string>;

  /** Sends a prompt and returns a ReadableStream for token-by-token output. */
  promptStreaming(
    prompt: string,
    options?: LanguageModelPromptOptions
  ): ReadableStream<string>;

  /** Frees the resources used by the session. */
  destroy(): Promise<void>;

  // You would add more types here for methods like clone(), append(), etc.
}

interface LanguageModelCreateOptions {
  // ... add session options like temperature, initialPrompts, etc.
}

interface LanguageModelPromptOptions {
  // ... add prompt options like signal, responseConstraint, etc.
}

interface LanguageModelParams {
  defaultTopK: number;
  maxTopK: number;
  defaultTemperature: number;
  maxTemperature: number;
}

declare global {
  interface Window {
    LanguageModel?: LanguageModelStatic;
  }
  const LanguageModel: LanguageModelStatic;
}

export {};
