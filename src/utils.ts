import type { ProofreaderInstance } from "./proofreader";
import type { LanguageModelInstance } from "./language-model";

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
  private proofreader: ProofreaderInstance | null;
  public proofreaderAvailable: boolean;
  private model: LanguageModelInstance | null;
  public modelAvailable: boolean;
  private rewriter: LanguageModelInstance | null;
  public rewriterAvailable: boolean;

  private constructor(
    proofreader: ProofreaderInstance | null,
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

    let proofreaderInstance: ProofreaderInstance | null = null;
    let proofreaderAvailable = false;
    let status = await Proofreader.availability();
    if (status === "available" || status === "downloadable") {
      proofreaderInstance = await Proofreader.create({
        expectedInputLanguages: ["en"],
        correctionExplanationLanguage: "en",
      });
      proofreaderAvailable = true;
    }

    let modelInstance: LanguageModelInstance | null = null;
    let modelAvailable = false;
    let rewriterInstance: LanguageModelInstance | null = null;
    let rewriterAvailable = false;
    status = await LanguageModel.availability();
    if (status === "available" || status === "downloadable") {
      modelInstance = await LanguageModel.create({
        initialPrompts: [
          {
            role: "system",
            content: `You are an assistant dedicated to improving users' writing.
              Input: You will receive a JSON string containing two keys:
              - sentence: The original sentence to be revised.
              - tone: The desired tone for the rewrite.
              Task: Provide 1 to 2 versions of the input sentence that are more naturla, idiomatic, and align with the specified tone.
              Output: You must return a JSON string and make sure your response only contains the JSON string without coding block markdown notation. Example: {"rewrite": [sentence1, ...]}`,
          },
        ],
        expectedInputs: [
          {
            type: "text",
            languages: ["en"],
          },
        ],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
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
              Output: The polished draft.`,
          },
        ],
        expectedInputs: [
          {
            type: "text",
            languages: ["en"],
          },
        ],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
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

  public async grammarCorrect(text: string): Promise<string> {
    if (!this.proofreaderAvailable) {
      throw Error("Proofreader is not available");
    }
    const proofreadResult = await this.proofreader?.proofread(text);
    console.log(proofreadResult);
    return proofreadResult?.corrections ? proofreadResult?.correctedInput : "";
  }

  public async naturalVariants(text: string, tone: string): Promise<string[]> {
    if (!this.modelAvailable) {
      throw Error("Model is not available");
    }
    const response = await this.model?.prompt([
      {
        role: "user",
        content: JSON.stringify({ sentence: text, tone }),
      },
    ]);
    if (response === undefined) {
      return [];
    }
    console.log(response);
    const result = JSON.parse(response);
    console.log(result);
    return result.rewrite || [];
  }

  public async polishDraft(text: string, tone: string): Promise<string> {
    if (!this.rewriterAvailable) {
      throw Error("Rewriter is not available");
    }
    const response = await this.rewriter?.prompt([
      { role: "user", content: JSON.stringify({ draft: text, tone }) },
    ]);
    if (response === undefined) {
      return "";
    }
    console.log(response);
    return response || "";
  }
}
