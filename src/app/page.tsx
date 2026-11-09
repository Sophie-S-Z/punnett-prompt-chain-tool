import { redirect } from "next/navigation";
import { adminAccess } from "@/lib/admin";
import { AuthControls } from "@/components/AuthControls";
import { ThemeControl } from "@/components/ThemeControl";
import { ClearanceRequired } from "@/components/product/ClearanceRequired";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
    return (
      <main id="main" className="access-screen">
        <p className="brand">
          Punnett <span>Prompt Chain Tool</span>
        </p>
        <h1>Not available yet</h1>
        <p>The owner has not connected this app to its database.</p>
      </main>
    );
  const access = await adminAccess();
  if (access.state === "admin") redirect("/chains");
  if (access.state !== "visitor")
    return <ClearanceRequired setup={access.state === "setup"} />;
  return (
    <main id="main" className="access-screen">
      <div className="access-top">
        <p className="brand">
          Punnett <span>Prompt Chain Tool</span>
        </p>
        <ThemeControl />
      </div>
      <h1>Create and test prompt chains</h1>
      {(await searchParams).auth === "failed" && (
        <p className="error" role="alert">
          Sign-in did not finish. Please try again.
        </p>
      )}
      <AuthControls />
      <p className="hint">Only superadmin accounts can sign in.</p>
    </main>
  );
}
