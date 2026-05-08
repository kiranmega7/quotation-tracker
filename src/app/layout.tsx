import type { Metadata } from "next";
import localFont from "next/font/local";
import { PipelineChatbot } from "@/components/chat/PipelineChatbot";
import { Nav } from "@/components/Nav";
import { createServerClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "QuoteTracker",
  description: "Track quotations, follow-ups, and notes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
        {user && <PipelineChatbot />}
      </body>
    </html>
  );
}
