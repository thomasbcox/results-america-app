import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SelectionProvider } from "@/lib/context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Results America",
  description: "The Great American Report Card",
  icons: [
    {
      url: '/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      url: '/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png'
    }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      >
        <SelectionProvider>
          {children}
        </SelectionProvider>
      </body>
    </html>
  );
}
