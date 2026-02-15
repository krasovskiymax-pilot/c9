/**
 * Этап 5 PLAN.md: интерфейс (форма и кнопки).
 * Этап 6 PLAN.md: блок отображения результата.
 */
import { useEffect, useRef, useState } from "react";
import { CircleAlert } from "lucide-react";
import type { Mode } from "../lib/prompts";
import { ERROR_MESSAGES } from "../lib/errors";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);
  const resultBlockRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [result, setResult] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!loading) {
      setStatusMessage(null);
      setElapsedSeconds(0);
      return;
    }
    setElapsedSeconds(0);
    setStatusMessage("Загружаю статью…");
    const t2 = setTimeout(
      () =>
        setStatusMessage(
          mode === "illustration" ? "Генерирую иллюстрацию…" : "Генерирую ответ…"
        ),
      2000
    );
    return () => clearTimeout(t2);
  }, [loading, mode]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
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
      setResultImage(null);

      if (selectedMode === "illustration") {
        const response = await fetch("/api/illustration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: currentUrl })
        });

        const data: { imageBase64?: string; error?: string } =
          await response.json();

        if (!response.ok) {
          setError(data.error ?? ERROR_MESSAGES.UNKNOWN);
          return;
        }

        if (data.error) {
          setError(data.error);
        } else if (data.imageBase64) {
          setResultImage(`data:image/png;base64,${data.imageBase64}`);
          resultBlockRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        return;
      }

      const response = await fetch("/api/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        const newResult = data.result ?? "";
        setResult(newResult);
        resultBlockRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch {
      setError(ERROR_MESSAGES.UNKNOWN);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUrl("");
    setResult("");
    setResultImage(null);
    setError(null);
    setMode(null);
    setStatusMessage(null);
    setCopied(false);
    setElapsedSeconds(0);
    urlInputRef.current?.focus();
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-10 sm:px-6">
      <div className="w-full max-w-3xl min-w-0 space-y-6 sm:space-y-8">
        <header className="text-center space-y-2 px-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight break-words">
            AI-помощник для англоязычных статей
          </h1>
          <p className="text-slate-300 text-sm md:text-base break-words">
            Вставьте ссылку на англоязычную статью и получите краткое
            объяснение, тезисы или текст для Telegram.
          </p>
        </header>

        <section className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 overflow-hidden">
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
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm md:text-base text-slate-100 placeholder-slate-500 outline-none ring-0 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
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

              <button
                type="button"
                disabled={loading}
                title="Сгенерировать иллюстрацию по статье"
                onClick={() => handleSubmit("illustration")}
                className={`flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  mode === "illustration"
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/40"
                    : "bg-slate-800/80 text-slate-100 hover:bg-slate-700"
                } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                Иллюстрация
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleClear}
                title="Сбросить URL, результат, ошибки и состояния"
                className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 transition"
              >
                Очистить
              </button>
            </div>
          </div>

          {/* 6. Блок отображения результата */}
          {/* 6.1. При ошибке: показывать error в карточке Alert (shadcn) */}
          {error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Блок текущего процесса — показывается только при загрузке */}
          {statusMessage && (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-2.5 text-sm text-slate-300 break-words flex items-center justify-between gap-3 flex-wrap">
              <span>{statusMessage}</span>
              <span className="tabular-nums text-slate-400 shrink-0">
                {Math.floor(elapsedSeconds / 60)}:
                {(elapsedSeconds % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}

          {/* 6.1. Поле «Результат»: result из API */}
          {/* 6.2. Placeholder, когда ещё нет результата */}
          <div ref={resultBlockRef} className="space-y-2 scroll-mt-4 min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-sm font-medium text-slate-200 min-w-0">
                Результат
              </span>
              {result && (
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Скопировать в буфер обмена"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 transition shrink-0"
                >
                  {copied ? "Скопировано" : "Копировать"}
                </button>
              )}
            </div>
            <div className="min-h-[180px] rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-100 overflow-hidden">
              {resultImage ? (
                <img
                  src={resultImage}
                  alt="Сгенерированная иллюстрация"
                  className="max-w-full h-auto rounded-lg"
                />
              ) : result ? (
                <div className="whitespace-pre-wrap break-words overflow-x-auto overflow-y-auto">
                  {result}
                </div>
              ) : !loading ? (
                "Здесь появится результат работы AI."
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
