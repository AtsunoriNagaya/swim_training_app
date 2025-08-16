// Shared JSON sanitization and validation for AI responses

/**
 * Extracts a JSON object string from arbitrary text, stripping code fences and
 * leading/trailing noise, and validates it by attempting JSON.parse.
 * On failure, returns the original content for downstream error handling.
 */
export function extractAndValidateJSON(content: string): string {
  if (!content) return content;

  let cleaned = content;

  // Remove fenced code blocks like ```json ... ``` or ``` ... ```
  const fenceRegex = /```(?:json)?\s*\n([\s\S]*?)\n```/i;
  const fenceMatch = cleaned.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1];
  }

  // Trim
  cleaned = cleaned.trim();

  // Extract the first JSON object by braces range
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (e) {
    console.warn("JSON形式の検証に失敗しました。元のコンテンツを返します。", e);
    return content;
  }
}

