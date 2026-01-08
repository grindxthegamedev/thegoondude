import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "TheGoonDude | The Cutest NSFW Directory",
  description: "Discover the best adult websites with AI-powered reviews. Honest, cute, and always up-to-date. Your go-to 411 for NSFW sites.",
  keywords: ["nsfw", "adult sites", "directory", "reviews", "porn sites", "411"],
  robots: "index, follow",
  openGraph: {
    title: "TheGoonDude | The Cutest NSFW Directory",
    description: "Discover the best adult websites with AI-powered reviews.",
    type: "website",
    locale: "en_US",
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
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
