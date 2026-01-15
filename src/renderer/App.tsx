import { HashRouter, Route, Routes } from "react-router-dom";
import { Index } from "./pages/Index/Index";
import { NewRanking } from "./pages/NewRanking/NewRanking";
import { Ranking } from "./pages/Ranking/Ranking";
import { RankingView } from "./pages/RankingView/RankingView";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/new" element={<NewRanking />} />
        <Route path="/rank/:rankingId" element={<Ranking />} />
        <Route path="/rank/:rankingId/view" element={<RankingView />} />
      </Routes>
    </HashRouter>
  );
}
