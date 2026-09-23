import { Link } from "react-router";

const MUTED = "#5a726e";
const LINE = "#1c2a2e";

const LINKS = [
  { to: "/about", label: "About" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/contact", label: "Contact" },
] as const;

// The single, consistent way to reach the site's "read once" pages from
// anywhere — replaces the scattered one-off contextual links each page was
// growing its own copy of. Not in HudFloorNav: Robin was explicit about not
// wanting multiple navigation systems, and these pages aren't things people
// return to the way Console/KB are (see the "why we're not adding a
// sidebar" conversation, 2026-09-23). This is content, styled like any
// site's plain footer links, not a second nav.
export function ContentFooterLinks() {
  return (
    <div
      className="mt-16 flex items-center gap-2 border-t pt-6 text-[13px] tracking-[0.03em]"
      style={{ borderColor: LINE, color: MUTED }}
    >
      {LINKS.map((link, index) => (
        <span key={link.to} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">·</span>}
          <Link to={link.to} className="hover:underline">
            {link.label}
          </Link>
        </span>
      ))}
    </div>
  );
}
