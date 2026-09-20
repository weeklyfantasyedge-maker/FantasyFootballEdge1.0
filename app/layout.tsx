import "./globals.css";

export const metadata = {
  title: "Fantasy Football Edge | I do the research. You set the lineup.",
  description:
    "Fantasy football analysis built around Environment, Deployment, Game Matchup and Evidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}