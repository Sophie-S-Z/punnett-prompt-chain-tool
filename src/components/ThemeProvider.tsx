"use client";
import { ThemeProvider as Provider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider
      attribute="data-theme"
      storageKey="punnett-studio-theme"
      defaultTheme="night"
      themes={["night", "lights-on"]}
      enableSystem
      enableColorScheme={false}
      value={{
        night: "night",
        "lights-on": "lights-on",
        dark: "night",
        light: "lights-on",
      }}
    >
      {children}
    </Provider>
  );
}
