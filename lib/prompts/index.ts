import { systemPrompt } from "./system";
import { userPrompt } from "./user";

export const PROMPT_TEMPLATES = {
  system: systemPrompt,
  user: userPrompt,
} as const;

export type PromptTemplates = typeof PROMPT_TEMPLATES;

