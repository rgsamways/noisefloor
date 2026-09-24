import { iconNames } from "lucide-react/dynamic.js";

// Build-time-only: catches a typo'd icon name (design.md's Decision 3).
// `lucide-react` is a devDependency of this package (never re-exported
// from index.ts) — apps/web, which actually renders the icon via
// lucide-react/dynamic's <DynamicIcon>, already depends on it directly.
// `iconNames` is lucide-react's own canonical kebab-case name list (e.g.
// "radio-tower") — the same list `<DynamicIcon name="...">` accepts, so
// validating against it (rather than hand-rolling a kebab->PascalCase
// conversion against the full icon-component export set) can't drift out
// of sync with what actually renders.
const VALID_ICON_NAMES: ReadonlySet<string> = new Set(iconNames);

export function isValidLucideIcon(name: string): boolean {
  return VALID_ICON_NAMES.has(name);
}
