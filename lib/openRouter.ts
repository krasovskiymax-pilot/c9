/**
 * Этап 4 PLAN.md: интеграция с OpenRouter.
 * 4.1. URL: chat/completions; модель: deepseek/deepseek-chat; ключ из OPENROUTER_API_KEY.
 * 4.2. system: контекст; user: текст статьи + инструкция.
 * 4.3. Извлечь content из choices[0].message и вернуть.
 */

import type { Mode } from "./prompts";
import { buildInstruction } from "./prompts";

const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY ?? "").replace(
  /^\[|\]$/g,
  ""
);
const OPENROUTER_BASE_URL =
  process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1";

const MODEL = "deepseek/deepseek-chat";

const SYSTEM_CONTEXT =
  "Ты помощник, который переводит и пересказывает англоязычные статьи на естественном русском языке.";

/**
 * Отправляет запрос в OpenRouter (Deepseek) и возвращает сгенерированный текст.
 * @param sourceUrl — URL статьи (передаётся для режима telegram, чтобы добавить ссылку на источник).
 */
export async function callOpenRouter(
  mode: Mode,
  articleText: string,
  sourceUrl?: string
): Promise<string> {
  if (!OPENROUTER_API_KEY.trim()) {
    throw new Error("OPENROUTER_API_KEY не задан в переменных окружения.");
  }

  const instruction = buildInstruction(mode, sourceUrl);

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_CONTEXT
        },
        {
          role: "user",
          content: [
            "Ниже текст англоязычной статьи.",
            "",
            articleText,
            "",
            "Выполни следующее действие:",
            instruction
          ].join("\n")
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Ошибка OpenRouter (${response.status}): ${body || "нет тела ответа"}`
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Пустой ответ от модели Deepseek.");
  }

  return content.trim();
}
