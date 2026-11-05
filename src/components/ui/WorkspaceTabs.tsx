"use client";
import Link from "next/link";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
/** Shared-element active state, following Motion's layout animation contract. */
export function WorkspaceTabs({
  items,
  label,
}: {
  items: { href: string; label: string; active: boolean }[];
  label: string;
}) {
  const reduce = useReducedMotion();
  return (
    <LayoutGroup>
      <nav className="workspace-tabs" aria-label={label}>
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={i.active ? "page" : undefined}
          >
            {i.active && (
              <motion.span
                className="workspace-tab-active"
                layoutId="workspace-current"
                transition={{ duration: reduce ? 0 : 0.18 }}
              />
            )}
            {i.label}
          </Link>
        ))}
      </nav>
    </LayoutGroup>
  );
}
