import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>AI Article Helper</title>
        <meta name="description" content="Парсинг англоязычных статей и генерация ответов с помощью AI" />
      </Head>
      <div className="min-h-screen bg-slate-900 text-slate-100 antialiased">
        <Component {...pageProps} />
      </div>
    </>
  );
}
