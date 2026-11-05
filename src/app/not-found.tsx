import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export default async function NotFound() {
  await requireAdmin();
  return (
    <main id="main" className="access-screen">
      <h1>Page not found</h1>
      <Link className="button ghost" href="/chains">
        Go to chains
      </Link>
    </main>
  );
}
