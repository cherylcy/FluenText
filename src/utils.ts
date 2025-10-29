import type { ProofreaderInstance } from "./proofreader";
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
              Output: The polished draft.`,
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

  public async getSuggestions(
    sentences: string[],
    tone: string
  ): Promise<Suggestion[]> {
    if (!this.proofreaderAvailable) {
      throw Error("Proofreader is not available");
    }
    if (!this.modelAvailable) {
      throw Error("Model is not available");
    }
    console.log(JSON.stringify(sentences));
    let proofreadResult = await this.proofreader?.prompt([
      {
        role: "user",
        content: JSON.stringify(sentences),
      },
    ]);
    console.log(proofreadResult);
    let correctedSentences;
    if (proofreadResult) {
      if (proofreadResult.startsWith("```json"))
        proofreadResult = proofreadResult.slice(7);
      if (proofreadResult.endsWith("```"))
        proofreadResult = proofreadResult.slice(0, -3);
      correctedSentences = JSON.parse(proofreadResult.trim());
      if (correctedSentences.length !== sentences.length) {
        console.log(proofreadResult);
        console.log(correctedSentences);
        throw Error(
          "Grammar corrected sentences do not match original sentences."
        );
      }
    } else {
      console.log(proofreadResult);
      throw Error("Failed to generate grammar corrected sentences.");
    }

    let modelResult = await this.model?.prompt([
      {
        role: "user",
        content: JSON.stringify({ tone, sentences }),
      },
    ]);
    console.log(modelResult);
    let naturalVariants;
    if (modelResult) {
      if (modelResult.startsWith("```json")) {
        modelResult = modelResult.slice(7);
      }
      if (modelResult.endsWith("```")) {
        modelResult = modelResult.slice(0, -3);
      }
      naturalVariants = JSON.parse(modelResult.trim());
      if (naturalVariants.length !== sentences.length) {
        console.log(modelResult);
        console.log(naturalVariants);
        throw Error("Natural variants do not match original sentences.");
      }
    } else {
      throw Error("Failed to generatl natural variants.");
    }

    let suggestions: Suggestion[] = [];
    for (let i = 0; i < sentences.length; i++) {
      const correct = correctedSentences[i] === sentences[i];
      if (
        correctedSentences[i] !== sentences[i] ||
        naturalVariants[i].length > 0
      )
        suggestions.push({
          sentence: sentences[i],
          corrected: correct ? "" : correctedSentences[i],
          variants: naturalVariants[i].filter(
            (s: string) => s !== correctedSentences[i] && s.length > 0
          ),
        });
    }
    return suggestions;
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
