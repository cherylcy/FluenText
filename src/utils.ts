export function splitSentences(text: string): string[] {
  const parts = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'\(\[])|(?<=[.!?])\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0 && text.trim()) return [text.trim()];
  return parts;
}

export async function grammarCorrect(text: string): Promise<string> {
  return text;
}

export async function naturalVariants(text: string): Promise<string[]> {
  return [text, text];
}

export async function polishDraft(text: string): Promise<string> {
  return text;
}
