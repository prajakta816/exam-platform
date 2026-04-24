import './CreateQuiz.css';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Trash2, Save, ArrowLeft, Plus, AlertCircle } from "lucide-react";
import API from "../../services/api";

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [errors, setErrors] = useState({});
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctAnswer: 0 }
  ]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) return;
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    // Clear specific errors for removed question
    if (errors.questions) {
      const newQErrors = [...errors.questions];
      newQErrors.splice(index, 1);
      setErrors({...errors, questions: newQErrors});
    }
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].question = value;
    setQuestions(newQuestions);
    clearError('question', index);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
    clearError('option', qIndex, oIndex);
  };

  const handleCorrectAnswerChange = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctAnswer = oIndex;
    setQuestions(newQuestions);
  };

  const handleAddOption = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push("");
    setQuestions(newQuestions);
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length <= 2) return;
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    if (newQuestions[qIndex].correctAnswer >= newQuestions[qIndex].options.length) {
      newQuestions[qIndex].correctAnswer = 0;
    }
    setQuestions(newQuestions);
  };

  const clearError = (type, qIndex, oIndex) => {
    const newErrors = { ...errors };
    if (type === 'title') delete newErrors.title;
    if (type === 'question' && newErrors.questions && newErrors.questions[qIndex]) {
      delete newErrors.questions[qIndex].question;
    }
    if (type === 'option' && newErrors.questions && newErrors.questions[qIndex]?.options) {
      delete newErrors.questions[qIndex].options[oIndex];
    }
    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Quiz title is required";
    
    const questionErrors = [];
    let hasQErrors = false;

    questions.forEach((q, i) => {
      const qErr = { options: [] };
      let hasErr = false;

      if (!q.question.trim()) {
        qErr.question = "Question text cannot be empty";
        hasErr = true;
        hasQErrors = true;
      }
      
      q.options.forEach((opt, j) => {
        if (!opt.trim()) {
          qErr.options[j] = "Option cannot be empty";
          hasErr = true;
          hasQErrors = true;
        }
      });

      questionErrors[i] = hasErr ? qErr : null;
    });

    if (hasQErrors) newErrors.questions = questionErrors;

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setGlobalError("Please fix the highlighted errors before saving.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      await API.post("/quiz/create", { title, description, questions });
      navigate("/board");
    } catch (err) {
      console.error(err);
      setGlobalError(err.response?.data?.message || "Failed to create quiz.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-quiz-container max-w-4xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/board')}
        className="flex items-center text-gray-500 hover:text-indigo-600 mb-6 transition font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-gray-100 p-6 md:p-8 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Create New Quiz</h1>
        <p className="text-gray-500 mb-8">Build a comprehensive and engaging assessment for your students.</p>

        {globalError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200 flex items-start animate-pulse">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <span className="font-medium">{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Quiz Meta */}
          <div className="space-y-5 bg-gray-50/50 p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Quiz Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  clearError('title');
                }}
                placeholder="e.g. Advanced JavaScript Concepts"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition bg-white
                  ${errors.title ? 'input-error border-red-500' : 'border-gray-300 focus:border-indigo-500'}
                `}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this quiz covers..."
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition bg-white"
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-2xl font-extrabold text-gray-800">Questions</h2>
              <span className="bg-indigo-100 text-indigo-800 text-sm font-bold px-3 py-1 rounded-full">
                {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
              </span>
            </div>
            
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="question-card rounded-2xl p-6 relative group">
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition opacity-0 group-hover:opacity-100"
                    title="Remove Question"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                
                <div className="mb-5">
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">
                      {qIndex + 1}
                    </span>
                    Question Text
                  </label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                    placeholder="What is the output of..."
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition
                      ${errors.questions?.[qIndex]?.question ? 'input-error border-red-500' : 'border-gray-300 focus:border-indigo-500'}
                    `}
                  />
                  {errors.questions?.[qIndex]?.question && (
                    <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.questions[qIndex].question}</p>
                  )}
                </div>

                <div className="pl-4 md:pl-8 border-l-2 border-indigo-100 space-y-3">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Options</label>
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="option-input-container">
                      <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="radio"
                            name={`correctAnswer-${qIndex}`}
                            checked={q.correctAnswer === oIndex}
                            onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                            className="w-5 h-5 text-emerald-500 focus:ring-emerald-500 border-gray-300 cursor-pointer"
                            title="Mark as correct answer"
                          />
                          {q.correctAnswer === oIndex && (
                            <span className="absolute -top-3 -left-2 text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 rounded">Correct</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                            className={`w-full px-4 py-2.5 border rounded-xl outline-none transition
                              ${errors.questions?.[qIndex]?.options?.[oIndex] ? 'input-error border-red-500' : 
                                q.correctAnswer === oIndex ? 'border-emerald-300 bg-emerald-50/50 focus:border-emerald-500' : 'border-gray-300 focus:border-indigo-500'}
                            `}
                          />
                        </div>
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(qIndex, oIndex)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                            title="Remove Option"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {errors.questions?.[qIndex]?.options?.[oIndex] && (
                        <p className="text-red-500 text-sm mt-1 ml-8 font-medium">{errors.questions[qIndex].options[oIndex]}</p>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => handleAddOption(qIndex)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg font-bold flex items-center mt-2 transition"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Option
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="btn-add-question w-full py-5 border-2 border-dashed border-gray-300 text-gray-600 font-bold rounded-2xl flex justify-center items-center"
          >
            <PlusCircle className="w-6 h-6 mr-2 text-indigo-500" />
            Add Another Question
          </button>

          <div className="pt-8 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={() => navigate('/board')}
              className="px-6 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg flex justify-center items-center transition-all
                ${loading 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'save-btn-gradient shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1'
                }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Publishing Quiz...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Publish Quiz
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
