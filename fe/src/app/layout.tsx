import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const queenText = localFont({
  src: [
    {
      path: "./fonts/queensides/Queensides-3z7Ey.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/queensides/QueensidesLight-ZVj3l.ttf",
      weight: "400",
      style: "light",
    },
    {
      path: "./fonts/queensides/QueensidesMedium-x30zV.ttf",
      weight: "600",
      style: "medium",
    },
  ],
  variable: "--font-text-queensides",
});

const motterdamText = localFont({
  src: [
    {
      path: "./fonts/motterdam/Motterdam-K74zp.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/motterdam/Motterdam-MVanr.otf",
      weight: "400",
      style: "light",
    }
  ],
  variable: "--font-text-motterdam"
});

export const metadata: Metadata = {
  title: "History Reimagined",
  description: "Prompt to visualize history books",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${queenText.variable} ${motterdamText.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
