import { Route, Routes } from "react-router";
import { RequireAuth } from "./components/RequireAuth";
import { RequireSiteAdmin } from "./components/RequireSiteAdmin";
import { SessionSync } from "./components/SessionSync";
import { About } from "./pages/About";
import { Admin } from "./pages/Admin";
import { AdminGroup } from "./pages/AdminGroup";
import { CasePlayer } from "./pages/CasePlayer";
import { Cases } from "./pages/Cases";
import { Console } from "./pages/Console";
import { Contact } from "./pages/Contact";
import { DevGallery } from "./pages/DevGallery";
import { KbArticleDetail } from "./pages/KbArticleDetail";
import { KbIndex } from "./pages/KbIndex";
import { Landing } from "./pages/Landing";
import { Me } from "./pages/Me";
import { Roadmap } from "./pages/Roadmap";
import { SignIn } from "./pages/SignIn";

export function App() {
  return (
    <>
      <SessionSync />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/console" element={<Console />} />
        <Route path="/kb" element={<KbIndex />} />
        <Route path="/kb/:slug" element={<KbArticleDetail />} />
        <Route element={<RequireAuth />}>
          <Route path="/me" element={<Me />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:slug" element={<CasePlayer />} />
          <Route element={<RequireSiteAdmin />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/groups/:groupId" element={<AdminGroup />} />
          </Route>
        </Route>
        {/* Dev-only, per NOISEFLOOR-OUTLINE.md §8 — import.meta.env.DEV is
            statically known at build time, so Vite tree-shakes this whole
            branch (and DevGallery) out of production bundles. */}
        {import.meta.env.DEV && <Route path="/dev/gallery" element={<DevGallery />} />}
      </Routes>
    </>
  );
}
