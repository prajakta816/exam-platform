import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Board from "./pages/Board";
import Quiz from "./pages/Quiz";
import Rank from "./pages/Rank";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/board" element={<Board />} />
        <Route path="/quiz/:id" element={<Quiz />} />
         <Route path="/rank/:id" element={<Rank />} />
        <Route path="/history" element={<History />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;