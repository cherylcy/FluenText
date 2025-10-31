import type { LanguageModelInstance } from "./language-model";

export interface Suggestion {
  sentence: string;
  corrected: string;
  variants: string[];
}

export function splitSentences(text: string): string[] {
  const parts = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'\(\[])|(?<=[.!?])\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0 && text.trim()) return [text.trim()];
  return parts;
}

export class AIEngine {
  private proofreader: LanguageModelInstance | null;
  public proofreaderAvailable: boolean;
  private model: LanguageModelInstance | null;
  public modelAvailable: boolean;
  private rewriter: LanguageModelInstance | null;
  public rewriterAvailable: boolean;

  private constructor(
    proofreader: LanguageModelInstance | null,
    proofreaderAvailable: boolean,
    model: LanguageModelInstance | null,
    modelAvailable: boolean,
    rewriter: LanguageModelInstance | null,
    rewriterAvailable: boolean
  ) {
    this.proofreader = proofreader;
    this.proofreaderAvailable = proofreaderAvailable;
    this.model = model;
    this.modelAvailable = modelAvailable;
    this.rewriter = rewriter;
    this.rewriterAvailable = rewriterAvailable;
  }

  public static async createEngine(): Promise<AIEngine> {
    if (!navigator.userActivation.isActive) {
      console.error("User does not allow AI Engine.");
      return new AIEngine(null, false, null, false, null, false);
    }

    let proofreaderInstance: LanguageModelInstance | null = null;
    let proofreaderAvailable = false;
    let modelInstance: LanguageModelInstance | null = null;
    let modelAvailable = false;
    let rewriterInstance: LanguageModelInstance | null = null;
    let rewriterAvailable = false;

    let status = await LanguageModel.availability();
    if (status === "available" || status === "downloadable") {
      proofreaderInstance = await LanguageModel.create({
        initialPrompts: [
          {
            role: "system",
            content: `Act like a function for proofreading sentences.
              Input: A JSON string representing a list of sentences. Example: ["sentence1", "sentence2", ...]
              Task: Provide a proofread version for each sentence in the list.
              Output: A JSON string (without any markdown code block syntax) in the exact same format as the input, where each element is the proofread version of the corresponding original sentence. Example: ["sentence1", "sentence2", ...]`,
          },
        ],
        outputLanguage: "en",
      });
      proofreaderAvailable = true;

      modelInstance = await LanguageModel.create({
        initialPrompts: [
          {
            role: "system",
            content: `You are an assistant dedicated to improving users' writing.
              Input: You will receive a JSON string containing two keys:
              - sentences: A list of original sentences to be revised.
              - tone: The desired tone for the rewrite.
              Task: Provide 2 to 3 versions of each of the input sentences that are more natural, idiomatic, and align with the specified tone. If the original sentence is good enough, you can leave it empty.
              Output: A JSON string (without any markdown code block syntax) which is a list of list of rewritten sentences corresponding to the input sentences. Example: [[sentence], [sentence, sentence], []]`,
          },
        ],
        outputLanguage: "en",
      });
      modelAvailable = true;

      rewriterInstance = await LanguageModel.create({
        initialPrompts: [
          {
            role: "system",
            content: `You are an assistant dedicated to improving users' writing.
              Input: You will receive a JSON string containing two keys:
              - draft: The original draft to be revised.
              - tone: The desired tone for the polish.
              Task: Polish the draft with the specified tone.
              Output: The polished draft, plain-text.`,
          },
        ],
        outputLanguage: "en",
      });
      rewriterAvailable = true;
    }

    return new AIEngine(
      proofreaderInstance,
      proofreaderAvailable,
      modelInstance,
      modelAvailable,
      rewriterInstance,
      rewriterAvailable
    );
  }

  public async *getSuggestions(
    sentences: string[],
    tone: string
  ): AsyncGenerator<Suggestion[]> {
    if (!this.proofreaderAvailable) {
      throw Error("Proofreader is not available");
    }
    if (!this.modelAvailable) {
      throw Error("Model is not available");
    }

    const batch = 5;
    for (let i = 0; i < sentences.length; i += batch) {
      const currentSentences = sentences.slice(i, i + batch);

      const correctedSentences = await this.getCorrectedBatch(currentSentences);
      const naturalVariants = await this.getVariantsBatch(
        currentSentences,
        tone
      );

      const batchSuggestions: Suggestion[] = [];
      for (let j = 0; j < currentSentences.length; j++) {
        const sentence = currentSentences[j];
        const correctedSentence = correctedSentences[j];
        const variants = naturalVariants[j] ?? [];
        const correct = correctedSentence === sentence;
        if (correctedSentence !== sentence || variants.length > 0) {
          batchSuggestions.push({
            sentence,
            corrected: correct ? "" : correctedSentence,
            variants: variants.filter(
              (s: string) =>
                s !== correctedSentence && s.length > 0 && s !== sentence
            ),
          });
        }
      }

      if (batchSuggestions.length > 0) {
        yield batchSuggestions;
      }
    }
  }

  private async getCorrectedBatch(sentences: string[]): Promise<string[]> {
    let retry = 0;
    const fallback = Array(sentences.length).fill("");
    while (retry <= 5) {
      let response = await this.proofreader?.prompt([
        {
          role: "user",
          content: JSON.stringify(sentences),
        },
      ]);
      if (response) {
        if (response.startsWith("```json")) response = response.slice(7);
        if (response.endsWith("```")) response = response.slice(0, -3);
        try {
          const result = JSON.parse(response.trim());
          if (result.length === sentences.length) {
            return result;
          }
        } catch (e) {
          if (!(e instanceof SyntaxError)) {
            console.error("Failed to generate grammar corrected sentences.", e);
          }
        }
      }
      retry++;
    }
    console.error(
      "Failed to generate grammar corrected sentences. Maximum retries reached."
    );
    return fallback;
  }

  private async getVariantsBatch(
    sentences: string[],
    tone: string
  ): Promise<string[][]> {
    let retry = 0;
    const fallback = Array.from(
      { length: sentences.length },
      () => [] as string[]
    );
    while (retry <= 5) {
      let response = await this.model?.prompt([
        {
          role: "user",
          content: JSON.stringify({
            tone,
            sentences,
          }),
        },
      ]);
      if (response) {
        if (response.startsWith("```json")) response = response.slice(7);
        if (response.endsWith("```")) response = response.slice(0, -3);
        try {
          const result = JSON.parse(response.trim());
          if (result.length === sentences.length) {
            return result;
          }
        } catch (e) {
          if (!(e instanceof SyntaxError)) {
            console.error("Failed to generate natural variants.", e);
          }
        }
      }
      retry++;
    }
    console.error(
      "Failed to generate natural variants. Maximum retries reached."
    );
    return fallback;
  }

  public async polishDraft(text: string, tone: string): Promise<string> {
    if (!this.rewriterAvailable) {
      console.error("Rewriter is not available");
      return "AI API is not available :(";
    }
    const response = await this.rewriter?.prompt([
      { role: "user", content: JSON.stringify({ draft: text, tone }) },
    ]);
    return response || "Something went wrong. Please try again :)";
  }
}

let engine: AIEngine;

export async function getEngine() {
  if (!engine) engine = await AIEngine.createEngine();
  return engine;
}
