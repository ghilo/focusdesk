import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import NextAuthProvider from "@/components/NextAuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "FocusDesk | ToDo List Entrepreneur",
  description: "Pilotez votre activité, vos clients et vos projets depuis une seule liste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased text-foreground bg-background`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextAuthProvider>
            <div className="flex h-screen overflow-hidden">
              <Navigation />
              <main className="flex-1 overflow-y-auto w-full pb-16 md:pb-0 relative">
                {children}
              </main>
            </div>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
