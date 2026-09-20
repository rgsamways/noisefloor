import { Route, Routes } from "react-router";
import { RequireAuth } from "./components/RequireAuth";
import { CasePlayer } from "./pages/CasePlayer";
import { Cases } from "./pages/Cases";
import { DevGallery } from "./pages/DevGallery";
import { Landing } from "./pages/Landing";
import { Me } from "./pages/Me";
import { SignIn } from "./pages/SignIn";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route element={<RequireAuth />}>
        <Route path="/me" element={<Me />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:slug" element={<CasePlayer />} />
      </Route>
      {/* Dev-only, per NOISEFLOOR-OUTLINE.md §8 — import.meta.env.DEV is
          statically known at build time, so Vite tree-shakes this whole
          branch (and DevGallery) out of production bundles. */}
      {import.meta.env.DEV && <Route path="/dev/gallery" element={<DevGallery />} />}
    </Routes>
  );
}
