import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Permanent_Marker } from "next/font/google";
import "./globals.css";

// Display type: heavy, slanted, sports-broadcast. Matches the logo lettering.
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

// Body type: same family, regular width, easy to read on a phone.
const body = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

// Brush type: stands in for the hand-painted "EDGE" in the logo.
const brush = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marker",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fantasy Football Edge | Weekly Start, Flex, Sit calls",
  description:
    "I do the research. You set the lineup. Weekly fantasy football Start, Flex, and Sit calls built on usage, matchups, and game environment.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${brush.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
