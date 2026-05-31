export type GusyGenerationSource = {
  type: string;
  model?: string;
};

function sourceModel(source?: GusyGenerationSource): string {
  return source?.model ?? 'LLM';
}

export function generatedPageStatus(source?: GusyGenerationSource): string {
  return source?.type === 'llm-gateway' ? `Generated: ${sourceModel(source)}` : 'Generated locally';
}

export function generatedSectionStatus(source?: GusyGenerationSource): string {
  return source?.type === 'llm-gateway' ? `Section generated: ${sourceModel(source)}` : 'Section added';
}

export function transformedSectionStatus(source?: GusyGenerationSource): string {
  return source?.type === 'llm-gateway' ? `Updated: ${sourceModel(source)}` : 'Updated';
}

export function generationErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
