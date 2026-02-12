/**
 * POST /api/article
 * Этап 2 PLAN.md: API-роут для обработки запросов.
 * Принимает: url (адрес статьи), mode ("about" | "thesis" | "telegram").
 * Возвращает: { result } или { error }.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { fetchArticleText } from "../../lib/fetchArticleText";
import { callOpenRouter } from "../../lib/openRouter";
import { type Mode } from "../../lib/prompts";

const VALID_MODES: Mode[] = ["about", "thesis", "telegram"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешён." });
  }

  try {
    const { url, mode } = req.body || {};

    // 1. Проверить наличие url и mode
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Не передан URL статьи." });
    }

    const currentMode: Mode = VALID_MODES.includes(mode) ? mode : "about";

    // 2. Вызвать fetchArticleText(url)
    const articleText = await fetchArticleText(url);

    // 3. Сформировать промпт для AI в зависимости от mode (в buildInstruction)
    // 4. Отправить запрос в OpenRouter (Deepseek)
    const result = await callOpenRouter(currentMode, articleText, url);

    // 5. Вернуть JSON с полем result или error
    return res.status(200).json({ result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Произошла непредвиденная ошибка на сервере."
    });
  }
}
