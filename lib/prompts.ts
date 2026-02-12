/**
 * Этап 3 PLAN.md: промпты для каждой кнопки.
 */

export type Mode = "about" | "thesis" | "telegram";

/**
 * «О чем статья?» — краткое объяснение на русском, 3–6 предложений.
 */
const ABOUT_PROMPT =
  "Кратко и понятным языком на русском объясни, о чем эта статья. 3–6 предложений.";

/**
 * «Тезисы» — структурированный список из 5–10 тезисов на русском.
 */
const THESIS_PROMPT =
  "Сделай структурированный список из 5–10 основных тезисов статьи на русском языке.";

/**
 * «Пост для Telegram» — готовый пост на русском, 1–3 абзаца, живой стиль, без упоминания ИИ.
 * В конце поста добавляется ссылка на источник.
 */
const TELEGRAM_PROMPT_BASE =
  "Составь готовый пост для Telegram на русском: живой, понятный, 1–3 абзаца, без упоминания, что текст создан ИИ.";
const TELEGRAM_SOURCE_LINK = " В конце поста добавь ссылку на источник статьи.";

export function buildInstruction(mode: Mode, sourceUrl?: string): string {
  switch (mode) {
    case "about":
      return ABOUT_PROMPT;
    case "thesis":
      return THESIS_PROMPT;
    case "telegram":
      return (
        TELEGRAM_PROMPT_BASE +
        TELEGRAM_SOURCE_LINK +
        (sourceUrl ? ` Укажи ссылку: ${sourceUrl}` : "")
      );
    default:
      return ABOUT_PROMPT;
  }
}
