/**
 * Этап 5 PLAN.md: интерфейс (форма и кнопки).
 * Этап 6 PLAN.md: блок отображения результата.
 */
import { useEffect, useRef, useState } from "react";
import type { Mode } from "../lib/prompts";
import { ERROR_MESSAGES } from "../lib/errors";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      setStatusMessage(null);
      return;
    }
    setStatusMessage("Загружаю статью…");
    const timer = setTimeout(() => setStatusMessage("Генерирую ответ…"), 2000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (selectedMode: Mode) => {
    const currentUrl = (urlInputRef.current?.value ?? url).trim();
    setMode(selectedMode);
    setError(null);
    setLoading(true);

    if (!currentUrl) {
      setError(ERROR_MESSAGES.INVALID_URL);
      setLoading(false);
      return;
    }

    try {
      setResult("");

      const response = await fetch("/api/article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: currentUrl, mode: selectedMode })
      });

      const data: { result?: string; error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error ?? ERROR_MESSAGES.UNKNOWN);
        return;
      }

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.result ?? "");
      }
    } catch {
      setError(ERROR_MESSAGES.UNKNOWN);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            AI-помощник для англоязычных статей
          </h1>
          <p className="text-slate-300 text-sm md:text-base">
            Вставьте ссылку на англоязычную статью и получите краткое
            объяснение, тезисы или текст для Telegram.
          </p>
        </header>

        <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
          {/* 5.1. Поле ввода URL статьи */}
          <div className="space-y-2">
            <label
              htmlFor="article-url"
              className="block text-sm font-medium text-slate-200"
            >
              URL статьи
            </label>
            <input
              ref={urlInputRef}
              id="article-url"
              type="url"
              placeholder="Введите URL статьи, например: https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm md:text-base text-slate-100 placeholder-slate-500 outline-none ring-0 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
            />
            <p className="text-xs text-slate-400">
              Укажите ссылку на англоязычную статью
            </p>
          </div>

          {/* 5.2. Три кнопки: onClick → handleSubmit(selectedMode), mode: about | thesis | telegram */}
          {/* 5.3. Визуальная подсветка активной кнопки (по mode) */}
          {/* 5.4. Состояния: loading, error, result */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Действие
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <button
                type="button"
                disabled={loading}
                title="Получить краткое объяснение о чём статья"
                onClick={() => handleSubmit("about")}
                className={`flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  mode === "about"
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/40"
                    : "bg-slate-800/80 text-slate-100 hover:bg-slate-700"
                } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                О чем статья?
              </button>

              <button
                type="button"
                disabled={loading}
                title="Выделить основные тезисы статьи"
                onClick={() => handleSubmit("thesis")}
                className={`flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  mode === "thesis"
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/40"
                    : "bg-slate-800/80 text-slate-100 hover:bg-slate-700"
                } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                Тезисы
              </button>

              <button
                type="button"
                disabled={loading}
                title="Создать пост для Telegram со ссылкой на источник"
                onClick={() => handleSubmit("telegram")}
                className={`flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  mode === "telegram"
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/40"
                    : "bg-slate-800/80 text-slate-100 hover:bg-slate-700"
                } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                Пост для Telegram
              </button>
            </div>
          </div>

          {/* 6. Блок отображения результата */}
          {/* 6.1. При ошибке: показывать error в карточке Alert (shadcn) */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Блок текущего процесса — показывается только при загрузке */}
          {statusMessage && (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-2.5 text-sm text-slate-300">
              {statusMessage}
            </div>
          )}

          {/* 6.1. Поле «Результат»: result из API */}
          {/* 6.2. Placeholder, когда ещё нет результата */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200">
                Результат
              </span>
            </div>
            <div className="min-h-[180px] rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-100 whitespace-pre-wrap">
              {result || (!loading && "Здесь появится результат работы AI.")}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
