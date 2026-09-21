import Image from "next/image";
import Link from "next/link";
import logo from "./logo.png";

/* Shared header and footer, used on the home page and the Terms page. */

export function SiteNav() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand" aria-label="Fantasy Football Edge home">
          <Image src={logo} alt="" className="brand-mark" width={44} height={44} />
          <span className="brand-name">
            Fantasy Football <em>Edge</em>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Main">
          <Link href="/#board">Edge Board</Link>
          <Link href="/#system">Start / Flex / Sit</Link>
          <Link href="/#method">Method</Link>
          <Link href="/terms" className="nav-keep">
            Terms
          </Link>
          <Link href="/#intake" className="btn btn-solid btn-sm">
            <span>Get lineup help</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ live = false }: { live?: boolean }) {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div className="footer-tag">I do the research. You set the lineup.</div>
        <p className="fine">
          Fantasy Football Edge is for entertainment. Calls are informed opinions, not
          guarantees. Always check the latest injury news before your lineup locks.
          {live && " Projections and injury data from Sleeper."}{" "}
          <Link href="/terms" className="fine-link">
            Football terms
          </Link>
        </p>
      </div>
    </footer>
  );
}
