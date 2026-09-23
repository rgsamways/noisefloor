import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

// The min-h-screen/padding wrapper + BottomNav shared by every "browse the
// app" screen (design.md) — Landing, Me, Cases, and the case player all use
// this. SignIn doesn't: it's a centered utility form, not a screen you
// navigate around in, same reasoning it already omits the floor nav.
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)] pb-[72px] md:pb-16">
      {children}
      <BottomNav />
    </div>
  );
}
