import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

/**
 * Scrolls to the top of the page on route change.
 *
 * Exceptions (no forced scroll-to-top):
 * - /beat/$beatId  — direct content link; page starts at top naturally
 * - /  (StorePage) — manages its own sessionStorage scroll restoration
 * - /showcase      — manages its own sessionStorage scroll restoration
 *
 * The exceptions ensure the back-navigation scroll restore on StorePage
 * and ShowcasePage continues to work exactly as before.
 */
export default function ScrollToTop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathname.current;
    prevPathname.current = pathname;

    // First render — no previous path, nothing to do
    if (prev === null) return;

    // Same route — no scroll needed
    if (prev === pathname) return;

    // Beat detail page — direct content link, skip forced scroll
    if (/^\/beat\//.test(pathname)) return;

    // StorePage (/) — has its own sessionStorage restoration, skip
    if (pathname === "/") return;

    // ShowcasePage — has its own sessionStorage restoration, skip
    if (pathname === "/showcase") return;

    // All other navigations → scroll to top instantly
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}
