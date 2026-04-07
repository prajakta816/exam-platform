import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

function Quiz() {
  const { id } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [time, setTime] = useState(60);

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    const res = await API.get(`/quiz/${id}`);
    setQuiz(res.data);
  };

  if (!quiz) return <p>Loading...</p>;

  return <h2>{quiz.title}</h2>;
}

export default Quiz; // ✅ VERY IMPORTANT