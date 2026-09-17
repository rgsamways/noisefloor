import { Route, Routes } from "react-router";
import { RequireAuth } from "./components/RequireAuth";
import { Hello } from "./pages/Hello";
import { SignIn } from "./pages/SignIn";

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Hello />} />
      </Route>
    </Routes>
  );
}
