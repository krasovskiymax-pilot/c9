import type { NextApiRequest, NextApiResponse } from "next";

const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY ?? "").replace(
  /^\[|\]$/g,
  ""
);
const OPENROUTER_BASE_URL =
  process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1";

type Mode = "about" | "thesis" | "telegram";

function buildInstruction(mode: Mode): string {
  switch (mode) {
    case "about":
      return "Кратко и понятным языком на русском объясни, о чем эта статья. 3–6 предложений.";
    case "thesis":
      return "Сделай структурированный список из 5–10 основных тезисов статьи на русском языке.";
    case "telegram":
      return "Составь готовый пост для Telegram на русском: живой, понятный, 1–3 абзаца, без упоминания, что текст создан ИИ.";
    default:
      return "Кратко опиши основную идею статьи на русском языке.";
  }
}

async function fetchArticleText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Не удалось загрузить статью (код ${response.status}). Сайт может ограничивать доступ.`
    );
  }

  const html = await response.text();

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, 15000);
}

async function callOpenRouter(mode: Mode, articleText: string): Promise<string> {
  if (!OPENROUTER_API_KEY.trim()) {
    throw new Error("OPENROUTER_API_KEY не задан в переменных окружения.");
  }

  const instruction = buildInstruction(mode);

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "Ты помощник, который переводит и пересказывает англоязычные статьи на естественном русском языке."
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешён." });
  }

  try {
    const { url, mode } = req.body || {};

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Не передан URL статьи." });
    }

    const currentMode: Mode = mode ?? "about";

    const articleText = await fetchArticleText(url);
    const result = await callOpenRouter(currentMode, articleText);

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
