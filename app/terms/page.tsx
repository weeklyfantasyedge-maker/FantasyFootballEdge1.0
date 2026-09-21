import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "../SiteChrome";
import Glossary from "./Glossary";

export const metadata: Metadata = {
  title: "Football Terms | Fantasy Football Edge",
  description:
    "Plain-English definitions of the football and fantasy stats behind the Edge Board, from snap % and target share to EPA, implied team totals, and player props.",
};

export default function TermsPage() {
  return (
    <>
      <SiteNav />
      <main>
        <section className="section terms-head">
          <div className="wrap">
            <h1 className="h2">Football terms, explained</h1>
            <p className="lede">
              The stats behind the Edge Board, from the everyday ones to the deep cuts. Each
              term says what it means, why it matters for your lineup, and whether the board
              uses it today.
            </p>
            <Glossary />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
