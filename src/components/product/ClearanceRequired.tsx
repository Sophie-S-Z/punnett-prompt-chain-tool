import { AuthControls } from "@/components/AuthControls";

export function ClearanceRequired({ setup = false }: { setup?: boolean }) {
  return (
    <main id="main" className="access-screen">
      <p className="brand">
        Punnett <span>Prompt Studio</span>
      </p>
      <h1>{setup ? "We could not check your access" : "No access"}</h1>
      <p>
        {setup
          ? "You are signed in, but the app could not read your role. Try again later, or ask the database owner to check the setup."
          : "This tool is for superadmins only. If you just got the role, sign out and sign in again."}
      </p>
      <AuthControls signedIn />
    </main>
  );
}
