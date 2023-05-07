import { useDark } from "@/core/hooks";
import "@/styles/globals.css";
import { ConfigProvider, theme } from "antd";
import "antd/dist/reset.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useState } from "react";
import "../styles/atom-one-dark.css";

export default function App({ Component, pageProps }: AppProps) {
  const isDark = useDark();
  const [orgin, setOrgin] = useState("");
  useEffect(() => {
    setOrgin(location.origin);
  }, []);
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#00b96b",
          colorInfoBg: isDark ? "#444a" : "#ddda",
          colorTextBase: isDark ? "#ddd" : "#333",
        },
        algorithm: isDark ? theme.darkAlgorithm : theme.compactAlgorithm,
      }}
    >
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        {orgin == "https://22733.site" ? (
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7936769145776010"
            crossOrigin="anonymous"
          ></script>
        ) : (
          <></>
        )}
      </Head>
      <Component {...pageProps} />
    </ConfigProvider>
  );
}
