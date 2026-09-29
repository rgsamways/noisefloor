import { Navigate, Route, Routes } from "react-router";
import { RequireAuth } from "./components/RequireAuth";
import { RequireSiteAdmin } from "./components/RequireSiteAdmin";
import { SessionSync } from "./components/SessionSync";
import { About } from "./pages/About";
import { AdminGroup } from "./pages/AdminGroup";
import { AdminUserReports } from "./pages/AdminUserReports";
import { CasePlayer } from "./pages/CasePlayer";
import { Cases } from "./pages/Cases";
import { Contact } from "./pages/Contact";
import { Customers } from "./pages/Customers";
import { CustomerSnapshot } from "./pages/CustomerSnapshot";
import { DeviceDetail } from "./pages/DeviceDetail";
import { DevGallery } from "./pages/DevGallery";
import { Hub } from "./pages/Hub";
import { KbArticleDetail } from "./pages/KbArticleDetail";
import { KbIndex } from "./pages/KbIndex";
import { Landing } from "./pages/Landing";
import { Reports } from "./pages/Reports";
import { Roadmap } from "./pages/Roadmap";
import { SignIn } from "./pages/SignIn";
import { SiteSettings } from "./pages/SiteSettings";
import { Tickets } from "./pages/Tickets";
import { UsersAndGroups } from "./pages/UsersAndGroups";

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
        <Route path="/kb" element={<KbIndex />} />
        <Route path="/kb/:slug" element={<KbArticleDetail />} />
        <Route element={<RequireAuth />}>
          <Route path="/hub" element={<Hub />} />
          <Route path="/me" element={<Navigate to="/reports" replace />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/devices/:deviceId" element={<DeviceDetail />} />
          <Route path="/tickets/customers/:customerId" element={<CustomerSnapshot />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:slug" element={<CasePlayer />} />
          <Route element={<RequireSiteAdmin />}>
            <Route path="/admin/users-and-groups" element={<UsersAndGroups />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/settings" element={<SiteSettings />} />
            <Route path="/admin/groups/:groupId" element={<AdminGroup />} />
            <Route path="/admin/users/:userId/reports" element={<AdminUserReports />} />
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
