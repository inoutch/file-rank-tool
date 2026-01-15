import { HashRouter, Route, Routes } from "react-router-dom";
import { Index } from "./pages/Index/Index";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Index />} />
      </Routes>
    </HashRouter>
  );
}
