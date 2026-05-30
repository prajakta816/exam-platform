import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { DarkModeProvider } from "./context/DarkModeContext";
import AITutorWidget from "./components/AITutorWidget";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Board from "./pages/Board/Board";
import Quiz from "./pages/Quiz/Quiz";
import CreateQuiz from "./pages/CreateQuiz/CreateQuiz";
import History from "./pages/History/History";
import Rank from "./pages/Rank/Rank";
import Analytics from "./pages/Analytics/Analytics";
import AI from "./pages/AI/AI";
import Notes from "./pages/Notes/Notes";
import UploadNote from "./pages/Notes/UploadNote";
import Flashcards from "./pages/Notes/Flashcards";
import StudyPlanner from "./pages/Notes/StudyPlanner";
import ChatTutor from "./pages/Notes/ChatTutor";
import Profile from "./pages/Profile/Profile";
import Search from "./pages/Search/Search";
import FollowRequests from "./pages/FollowRequests/FollowRequests";
import EditProfile from "./pages/Profile/EditProfile";
import LiveDashboard from "./pages/LiveRoom/LiveDashboard";
import LiveJoin from "./pages/LiveRoom/LiveJoin";
import LiveRoom from "./pages/LiveRoom/LiveRoom";
import LiveHistory from "./pages/LiveRoom/LiveHistory";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";

function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <Navbar />
        <AITutorWidget />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-16 text-slate-900 dark:text-slate-100 transition-colors duration-300">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/board" element={<ProtectedRoute><Board /></ProtectedRoute>} />
            <Route path="/create-quiz" element={<ProtectedRoute><CreateQuiz /></ProtectedRoute>} />
            <Route path="/ai" element={<ProtectedRoute><AI /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><FollowRequests /></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
            <Route path="/notes/upload" element={<ProtectedRoute><UploadNote /></ProtectedRoute>} />
            <Route path="/flashcards/:noteId" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
            <Route path="/study-planner" element={<ProtectedRoute><StudyPlanner /></ProtectedRoute>} />
            <Route path="/chat-tutor/:noteId" element={<ProtectedRoute><ChatTutor /></ProtectedRoute>} />
            <Route path="/quiz/:id" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
            <Route path="/rank/:id" element={<ProtectedRoute><Rank /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/live-dashboard" element={<ProtectedRoute><LiveDashboard /></ProtectedRoute>} />
            <Route path="/live-join" element={<ProtectedRoute><LiveJoin /></ProtectedRoute>} />
            <Route path="/live-room/:roomCode" element={<ProtectedRoute><LiveRoom /></ProtectedRoute>} />
            <Route path="/live-history" element={<ProtectedRoute><LiveHistory /></ProtectedRoute>} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
        </div>
      </BrowserRouter>
    </DarkModeProvider>
  );
}

export default App;