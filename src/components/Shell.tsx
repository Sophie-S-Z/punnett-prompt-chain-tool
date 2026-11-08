import Link from "next/link";
import { AuthControls } from "./AuthControls";
import { ThemeControl } from "./ThemeControl";

export function Shell({
  children,
  section,
}: {
  children: React.ReactNode;
  section: "chains" | "runs";
}) {
  return (
    <>
      <header className="topbar">
        <Link href="/chains" className="brand">
          Punnett <span>Prompt Chain Tool</span>
        </Link>
        <nav className="topnav" aria-label="Main">
          <Link
            href="/chains"
            aria-current={section === "chains" ? "page" : undefined}
          >
            Chains
          </Link>
          <Link
            href="/runs"
            aria-current={section === "runs" ? "page" : undefined}
          >
            Runs
          </Link>
        </nav>
        <div className="topbar-end">
          <ThemeControl />
          <AuthControls signedIn quiet />
        </div>
      </header>
      {children}
    </>
  );
}
