import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

// The min-h-screen/padding wrapper + BottomNav shared by the pages that
// haven't moved to the HUD shell yet (Cases, the case player). SignIn
// doesn't use this either: it's a centered utility form, not a screen you
// navigate around in, same reasoning it already omits the floor nav.
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)] pb-[72px] md:pb-16">
      {children}
      <BottomNav />
    </div>
  );
}
