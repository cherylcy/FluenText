export function splitSentences(text: string): string[] {
  const parts = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'\(\[])|(?<=[.!?])\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0 && text.trim()) return [text.trim()];
  return parts;
}

export function grammarCorrect(text: string): string {
  return "Grammar corrected sentence.";
}

export function naturalVariants(text: string): string[] {
  return ["Natural sentence 1.", "Natural sentence 2."];
}

export async function polishDraft(text: string): Promise<string> {
  return text;
}
