import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Board() {
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const res = await API.get("/quiz");
    setQuizzes(res.data);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">📚 Quiz Board</h1>

      <button
        onClick={() => navigate("/history")}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        View History
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz._id} className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-xl font-semibold">{quiz.title}</h2>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => navigate(`/quiz/${quiz._id}`)}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                Start
              </button>

              <button
                onClick={() => navigate(`/rank/${quiz._id}`)}
                className="bg-purple-500 text-white px-3 py-1 rounded"
              >
                Rank
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}