import { HashRouter, Route, Routes } from "react-router-dom";
import { Index } from "./pages/Index/Index";
import { NewRanking } from "./pages/NewRanking/NewRanking";
import { Ranking } from "./pages/Ranking/Ranking";
import { RankingView } from "./pages/RankingView/RankingView";
import { RankingEdit } from "./pages/RankingEdit/RankingEdit";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/new" element={<NewRanking />} />
        <Route path="/rank/:rankingId" element={<Ranking />} />
        <Route path="/rank/:rankingId/view" element={<RankingView />} />
        <Route path="/rank/:rankingId/edit" element={<RankingEdit />} />
      </Routes>
    </HashRouter>
  );
}
