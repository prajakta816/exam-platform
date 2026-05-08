import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const LiveDashboard = () => {
  const [testName, setTestName] = useState("");
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctAnswer: 0, timer: 30 },
  ]);
  const [loading, setLoading] = useState(false);
  const [allowTeacherAttempt, setAllowTeacherAttempt] = useState(false);
  
  // AI State
  const [aiMode, setAiMode] = useState("topic");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiFile, setAiFile] = useState(null);
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [generatingAI, setGeneratingAI] = useState(false);
  
  const [myTests, setMyTests] = useState([]);
  const [selectedAnalytics, setSelectedAnalytics] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    fetchMyTests();
    
    // ✅ Auto-load analytics if roomCode is in URL
    const params = new URLSearchParams(location.search);
    const roomCode = params.get("roomCode");
    if (roomCode) {
      fetchDeepAnalytics(roomCode);
      // Scroll to analytics section
      setTimeout(() => {
        const dashboardElement = document.getElementById("progress-dashboard");
        if (dashboardElement) dashboardElement.scrollIntoView({ behavior: 'smooth' });
      }, 800);
    }
  }, [location.search]);

  const fetchMyTests = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/results/my-tests", {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      });
      setMyTests(data.tests);
    } catch (error) {
      console.error("Failed to fetch my tests", error);
    }
  };

  const fetchDeepAnalytics = async (roomCode) => {
    setLoadingResults(true);
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/results/analytics/${roomCode}`,
        { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } }
      );
      setSelectedAnalytics(data);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch analytics");
    } finally {
      setLoadingResults(false);
    }
  };

  const handleGenerateAI = async () => {
    if (aiMode === "topic" && !aiPrompt) return alert("Please enter a topic");
    if (aiMode === "text" && !aiPrompt) return alert("Please enter text content");
    if (aiMode === "pdf" && !aiFile) return alert("Please upload a PDF");

    setGeneratingAI(true);
    
    try {
      let endpoint = "http://localhost:5000/api/ai/generate-text";
      let payload;
      let headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };

      if (aiMode === "pdf") {
        endpoint = "http://localhost:5000/api/ai/generate-pdf";
        payload = new FormData();
        payload.append("file", aiFile);
        payload.append("numQuestions", aiNumQuestions);
        payload.append("title", testName || "Live Test");
        headers["Content-Type"] = "multipart/form-data";
      } else if (aiMode === "topic") {
        payload = {
          topic: aiPrompt,
          title: testName || "Live Test",
          numQuestions: aiNumQuestions
        };
      } else {
        payload = {
          text: aiPrompt,
          title: testName || "Live Test",
          numQuestions: aiNumQuestions
        };
      }

      const { data } = await axios.post(endpoint, payload, { headers });
      
      const newQuestions = data.questions.map(q => ({
        ...q,
        timer: 30 // Default timer for AI questions
      }));

      // If only one empty question exists, replace it, else append
      if (questions.length === 1 && !questions[0].question) {
        setQuestions(newQuestions);
      } else {
        setQuestions([...questions, ...newQuestions]);
      }
      
      setAiPrompt("");
      setAiFile(null);
      alert("AI Questions generated and added to editor!");

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to generate AI questions");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], correctAnswer: 0, timer: 30 },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleCreateRoom = async () => {
    if (loading) return; // 🛡️ Prevent double execution
    if (!testName) return alert("Please enter a test name");
    setLoading(true);
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/room/create",
        { testName, allowTeacherAttempt, questions },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      navigate(`/live-room/${data.roomCode}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create room");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-800 shadow-xl rounded-2xl mt-10">
      <h1 className="text-3xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">Teacher Dashboard</h1>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Test Name</label>
        <input
          type="text"
          className="w-full p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          placeholder="Enter test name"
        />
      </div>

      <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-indigo-800 dark:text-indigo-300">Teacher Participation</h3>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">Allow yourself to answer questions alongside students.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={allowTeacherAttempt}
            onChange={(e) => setAllowTeacherAttempt(e.target.checked)}
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {/* AI GENERATION SECTION */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-900">
        <h3 className="font-black text-xl mb-4 text-purple-700 dark:text-purple-400 flex items-center gap-2">
          ✨ Generate Questions with AI
        </h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white dark:bg-slate-800 p-1 rounded-lg w-max border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setAiMode("topic")}
            className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${aiMode === "topic" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
          >
            By Topic
          </button>
          <button 
            onClick={() => setAiMode("text")}
            className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${aiMode === "text" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
          >
            By Text Content
          </button>
          <button 
            onClick={() => setAiMode("pdf")}
            className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${aiMode === "pdf" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
          >
            By PDF
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            {aiMode === "topic" && (
              <>
                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Enter a Topic</label>
                <textarea
                  className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-600 min-h-[100px]"
                  placeholder="E.g. The Solar System, Python Basics, World War II..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </>
            )}
            {aiMode === "text" && (
              <>
                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Paste Source Text</label>
                <textarea
                  className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-600 min-h-[100px]"
                  placeholder="Paste your article, paragraph, or essay here..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </>
            )}
            {aiMode === "pdf" && (
              <>
                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Upload PDF Document</label>
                <input
                  type="file"
                  accept=".pdf"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  onChange={(e) => setAiFile(e.target.files[0])}
                />
              </>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Number of Questions</label>
            <input
              type="number"
              min="1"
              max="20"
              className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-600"
              value={aiNumQuestions}
              onChange={(e) => setAiNumQuestions(parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <button
          onClick={handleGenerateAI}
          disabled={generatingAI}
          className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30 disabled:opacity-50"
        >
          {generatingAI ? "🧠 Generating..." : "Generate AI Questions"}
        </button>
      </div>

      <div className="space-y-6">
        {questions.map((q, index) => (
          <div key={index} className="p-4 border rounded-xl dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Question {index + 1}</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs">Timer (s):</label>
                <input
                  type="number"
                  className="w-16 p-1 text-sm border rounded dark:bg-slate-700"
                  value={q.timer}
                  onChange={(e) => handleQuestionChange(index, "timer", parseInt(e.target.value))}
                />
              </div>
            </div>
            <input
              type="text"
              className="w-full p-3 mb-4 rounded-lg border dark:bg-slate-700"
              value={q.question}
              onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
              placeholder="Enter question text"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    checked={q.correctAnswer === oIndex}
                    onChange={() => handleQuestionChange(index, "correctAnswer", oIndex)}
                  />
                  <input
                    type="text"
                    className="w-full p-2 border rounded dark:bg-slate-700"
                    value={opt}
                    onChange={(e) => handleOptionChange(index, oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={handleAddQuestion}
          className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
        >
          + Add Question
        </button>
        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
        >
          {loading ? "Creating..." : "Create Room & Start"}
        </button>
      </div>

      <div id="progress-dashboard" className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200">Progress Dashboard</h2>
        
        {myTests.length === 0 ? (
          <p className="text-slate-500">You haven't conducted any live tests yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {myTests.map((test) => (
              <div 
                key={test.roomCode} 
                onClick={() => fetchDeepAnalytics(test.roomCode)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${selectedAnalytics?.roomCode === test.roomCode ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">{test.testName}</h3>
                  <span className="text-xs font-black bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{test.roomCode}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-500">
                  <span>{new Date(test.date).toLocaleDateString()}</span>
                  <span>{test.totalParticipants} Participants</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {loadingResults && <p className="text-center text-slate-500 font-bold my-8 animate-pulse">Loading Deep Analytics...</p>}

        {selectedAnalytics && !loadingResults && (
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 mt-8">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-black text-indigo-600">{selectedAnalytics.testName} Analytics</h3>
               <button onClick={() => setSelectedAnalytics(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕ Close</button>
            </div>

            {/* LEADERBOARD SECTION */}
            <div className="mb-12">
              <h4 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 pb-2">Student Leaderboard</h4>
              <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-500">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-500">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-500">Badge</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-500">Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {selectedAnalytics.leaderboard.map((res, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/80">
                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{res.studentName}</td>
                        <td className="px-6 py-4 font-black text-indigo-600">{res.score}</td>
                        <td className="px-6 py-4">
                          {res.badge === "Gold" && <span className="text-yellow-500 font-bold">🥇 Gold</span>}
                          {res.badge === "Silver" && <span className="text-slate-400 font-bold">🥈 Silver</span>}
                          {res.badge === "Bronze" && <span className="text-orange-500 font-bold">🥉 Bronze</span>}
                        </td>
                        <td className="px-6 py-4">
                          {res.growth === "increase" && <span className="text-green-500 font-bold flex items-center gap-1">📈 Increase</span>}
                          {res.growth === "decrease" && <span className="text-red-500 font-bold flex items-center gap-1">📉 Decrease</span>}
                          {res.growth === "same" && <span className="text-slate-400 font-bold flex items-center gap-1">➖ Same</span>}
                          {res.growth === "first" && <span className="text-blue-400 font-bold flex items-center gap-1">🌟 First</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QUESTION ANALYSIS SECTION */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 pb-2">Question Analysis</h4>
              <div className="space-y-4">
                {selectedAnalytics.questionBank.map((q, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-800 dark:text-slate-200 mb-2"><span className="text-indigo-500 mr-2">Q{i + 1}:</span>{q.question}</p>
                    <div className="mb-4">
                      <p className="text-sm font-bold text-green-600 bg-green-50 inline-block px-2 py-1 rounded">Correct Answer: {q.options[q.correctAnswer]}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500 mb-2">Students who answered correctly ({q.correctStudents?.length || 0}):</p>
                      {q.correctStudents?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {q.correctStudents.map((studentName, idx) => (
                            <span key={idx} className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full border border-indigo-100">
                              {studentName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No one answered this correctly.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDashboard;
