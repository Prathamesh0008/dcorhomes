"use client";

import { useEffect, type ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    function revalidateRestoredPage(event: PageTransitionEvent) {
      if (event.persisted) window.location.reload();
    }

    window.addEventListener("pageshow", revalidateRestoredPage);
    return () => window.removeEventListener("pageshow", revalidateRestoredPage);
  }, []);

  return children;
}
