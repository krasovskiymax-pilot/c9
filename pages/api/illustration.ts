/**
 * POST /api/illustration
 * Загружает статью → генерирует промпт через OpenRouter → генерирует изображение через Hugging Face.
 * Возвращает: { imageBase64 } или { error }.
 */
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } }
};
import { fetchArticleText } from "../../lib/fetchArticleText";
import { generateImagePrompt } from "../../lib/openRouter";
import { generateImage } from "../../lib/huggingFace";
import { ERROR_MESSAGES } from "../../lib/errors";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: ERROR_MESSAGES.UNKNOWN });
  }

  const { url } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_URL });
  }

  let articleText: string;
  try {
    articleText = await fetchArticleText(url);
  } catch (error) {
    console.error("[fetchArticleText]", error);
    return res.status(400).json({ error: ERROR_MESSAGES.ARTICLE_FETCH_FAILED });
  }

  let imagePrompt: string;
  try {
    imagePrompt = await generateImagePrompt(articleText);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[generateImagePrompt]", errMsg);
    return res.status(500).json({ error: ERROR_MESSAGES.AI_PROCESSING_FAILED });
  }

  let imageBuffer: Buffer;
  try {
    imageBuffer = await generateImage(imagePrompt);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[generateImage]", errMsg);
    return res.status(500).json({ error: ERROR_MESSAGES.IMAGE_GENERATION_FAILED });
  }

  const imageBase64 = imageBuffer.toString("base64");
  return res.status(200).json({ imageBase64 });
}
