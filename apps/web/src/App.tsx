import { Route, Routes } from "react-router";
import { RequireAuth } from "./components/RequireAuth";
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
      </Route>
    </Routes>
  );
}
