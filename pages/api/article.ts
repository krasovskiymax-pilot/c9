/**
 * POST /api/article
 * Этап 2 PLAN.md: API-роут для обработки запросов.
 * Принимает: url (адрес статьи), mode ("about" | "thesis" | "telegram").
 * Возвращает: { result } или { error }.
 * Ошибки возвращаются только в виде дружественных текстов, без сырых сообщений из API.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { fetchArticleText } from "../../lib/fetchArticleText";
import { callOpenRouter } from "../../lib/openRouter";
import { type Mode } from "../../lib/prompts";
import { ERROR_MESSAGES } from "../../lib/errors";

const VALID_MODES: Mode[] = ["about", "thesis", "telegram"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: ERROR_MESSAGES.UNKNOWN });
  }

  const { url, mode } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_URL });
  }

  const currentMode: Mode = VALID_MODES.includes(mode) ? mode : "about";

  let articleText: string;
  try {
    articleText = await fetchArticleText(url);
  } catch (error) {
    console.error("[fetchArticleText]", error);
    return res.status(400).json({ error: ERROR_MESSAGES.ARTICLE_FETCH_FAILED });
  }

  try {
    const result = await callOpenRouter(currentMode, articleText, url);
    return res.status(200).json({ result });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const hasKey = Boolean(process.env.OPENROUTER_API_KEY?.trim());
    console.error(
      "[callOpenRouter]",
      errMsg,
      "| OPENROUTER_API_KEY:",
      hasKey ? "present" : "MISSING"
    );
    return res.status(500).json({ error: ERROR_MESSAGES.AI_PROCESSING_FAILED });
  }
}
