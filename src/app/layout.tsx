import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AgeGate, ErrorBoundary } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TheGoonDude | AI-Powered NSFW Directory",
    template: "%s | TheGoonDude",
  },
  description: "The 411 on adult sites. AI-powered reviews that don't suck. Every site rated, roasted, and ranked. Your brutally honest NSFW directory.",
  keywords: ["nsfw directory", "adult site reviews", "porn site ratings", "AI reviews", "411 adult"],
  robots: "index, follow",
  metadataBase: new URL("https://thegoondude.com"),
  openGraph: {
    title: "TheGoonDude | AI-Powered NSFW Directory",
    description: "The 411 on adult sites. AI reviews that don't suck.",
    type: "website",
    locale: "en_US",
    siteName: "TheGoonDude",
    images: [
      {
        url: "/mascot.png",
        width: 512,
        height: 512,
        alt: "TheGoonDude Mascot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TheGoonDude | AI-Powered NSFW Directory",
    description: "The 411 on adult sites. AI reviews that don't suck.",
    images: ["/mascot.png"],
  },
  alternates: {
    canonical: "https://thegoondude.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0D0D0D" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AgeGate />
        <Header />
        <ErrorBoundary>
          <main>{children}</main>
        </ErrorBoundary>
        <Footer />
      </body>
    </html>
  );
}
