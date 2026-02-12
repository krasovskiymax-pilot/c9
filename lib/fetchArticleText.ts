const FETCH_TIMEOUT_MS = 30_000; // 30 секунд
const MAX_TEXT_LENGTH = 15_000;

/**
 * Загружает HTML страницы по URL, извлекает текст и возвращает его.
 * Этап 1 PLAN.md: парсинг статьи по URL.
 */
export async function fetchArticleText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml"
      }
    });

    clearTimeout(timeoutId);

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

    if (!text) {
      throw new Error("Не удалось извлечь текст из статьи. Страница может быть пустой или защищена.");
    }

    return text.slice(0, MAX_TEXT_LENGTH);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Превышено время ожидания загрузки статьи (30 с). Попробуйте ещё раз.");
      }
      if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
        throw new Error("Сайт недоступен. Проверьте URL и подключение к интернету.");
      }
      throw error;
    }

    throw new Error("Не удалось загрузить статью. Попробуйте другой URL.");
  }
}
