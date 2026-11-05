"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="access-screen">
      <h1>This page did not load</h1>
      <p>Check your connection, then try again.</p>
      <div className="row">
        <button className="button" onClick={reset}>
          Try again
        </button>
        <Link className="button ghost" href="/chains">
          Go to chains
        </Link>
      </div>
    </main>
  );
}
