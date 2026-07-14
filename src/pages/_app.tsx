import "@mantine/core/styles.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { MantineProvider, createTheme } from "@mantine/core";
import { Inter, Merriweather, JetBrains_Mono } from "next/font/google";
import Head from "next/head";
import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Merriweather({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const theme = createTheme({
  fontFamily: "var(--font-sans)",
  fontFamilyMonospace: "var(--font-mono)",
  headings: {
    fontFamily: "var(--font-sans)",
    fontWeight: "600",
  },
  defaultRadius: "md",
  primaryColor: "indigo",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </Head>
      <div
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications position="top-right" />
          <Component {...pageProps} />
        </MantineProvider>
      </div>
    </>
  );
}
