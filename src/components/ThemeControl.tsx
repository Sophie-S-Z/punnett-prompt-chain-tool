"use client";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
const subscribe = () => () => {};
export function ThemeControl() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const { theme, setTheme } = useTheme();
  return (
    <label className="theme-control">
      Appearance
      <select
        value={mounted ? (theme ?? "night") : "night"}
        onChange={(e) => setTheme(e.target.value)}
      >
        <option value="night">Dark</option>
        <option value="lights-on">Light</option>
        <option value="system">System</option>
      </select>
    </label>
  );
}
