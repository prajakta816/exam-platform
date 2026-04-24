import './Analytics.css';
import { useEffect, useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import API from "../../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Analytics() {
  const [data, setData] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dateRange, setDateRange] = useState("all");
  const [searchQuiz, setSearchQuiz] = useState("");

  useEffect(() => {
    fetchData();
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const fetchData = async () => {
    try {
      const res = await API.get("/attempt/history");
      setData(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  const filteredData = useMemo(() => {
    let filtered = [...data];
    
    if (dateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (dateRange === "7") cutoff.setDate(now.getDate() - 7);
      if (dateRange === "30") cutoff.setDate(now.getDate() - 30);
      
      filtered = filtered.filter(d => new Date(d.createdAt) >= cutoff);
    }

    if (searchQuiz.trim() !== "") {
      filtered = filtered.filter(d => 
        d.quiz?.title?.toLowerCase().includes(searchQuiz.toLowerCase())
      );
    }

    return filtered;
  }, [data, dateRange, searchQuiz]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) return { avg: 0, high: 0, low: 0, attempts: 0 };
    const scores = filteredData.map(d => d.percentage || d.score || 0);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const high = Math.max(...scores);
    const low = Math.min(...scores);
    return { avg, high, low, attempts: filteredData.length };
  }, [filteredData]);

  const gamificationMsg = useMemo(() => {
    if (filteredData.length < 2) return null;
    const sorted = [...filteredData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const lastScore = sorted[sorted.length - 1].percentage || sorted[sorted.length - 1].score || 0;
    const previousAvg = stats.avg;
    const diff = Math.round(lastScore - previousAvg);
    
    if (diff > 0) return { type: 'positive', text: `Trending up! Last score was ${diff}% above average.` };
    if (diff < 0) return { type: 'negative', text: `Keep practicing. Last score was ${Math.abs(diff)}% below average.` };
    return { type: 'neutral', text: `Consistent performance.` };
  }, [filteredData, stats]);

  const chartData = {
    labels: filteredData.map((d) => d.quiz?.title || 'Unknown Quiz'),
    datasets: [
      {
        label: "Score (%)",
        data: filteredData.map((d) => d.percentage || d.score || 0),
        backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.7)' : 'rgba(79, 70, 229, 0.6)',
        borderColor: isDarkMode ? 'rgb(129, 140, 248)' : 'rgb(79, 70, 229)',
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: isDarkMode ? 'rgba(129, 140, 248, 0.9)' : 'rgba(79, 70, 229, 0.9)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        labels: { color: isDarkMode ? '#f9fafb' : '#111827' }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        titleColor: isDarkMode ? '#f9fafb' : '#111827',
        bodyColor: isDarkMode ? '#d1d5db' : '#4b5563',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          afterBody: (context) => {
            const index = context[0].dataIndex;
            const item = filteredData[index];
            if (item && item.createdAt) {
              return `\nDate: ${new Date(item.createdAt).toLocaleDateString()}\nTotal Qs: ${item.totalQuestions || 'N/A'}`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: isDarkMode ? '#374151' : '#e5e7eb' },
        ticks: { color: isDarkMode ? '#9ca3af' : '#6b7280', stepSize: 20 }
      },
      x: {
        grid: { display: false },
        ticks: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    }
  };

  return (
    <div className="analytics-wrapper py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
              Performance Analytics
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Track your quiz scores and progress over time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input 
              type="text" 
              placeholder="Search quiz..." 
              className="filter-select shadow-sm"
              value={searchQuiz}
              onChange={(e) => setSearchQuiz(e.target.value)}
              aria-label="Filter by quiz title"
            />
            
            <select 
              className="filter-select shadow-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Filter by date range"
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="theme-toggle shadow-sm"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Gamification Badge */}
        {gamificationMsg && (
          <div className="mb-6 flex">
            <span className={`gamification-badge ${gamificationMsg.type}`}>
              {gamificationMsg.type === 'positive' ? '🚀' : gamificationMsg.type === 'negative' ? '💪' : '⭐'} 
              {gamificationMsg.text}
            </span>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="stat-box">
            <div className="stat-label">Average Score</div>
            <div className="stat-value">{stats.avg}%</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Highest Score</div>
            <div className="stat-value">{stats.high}%</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Lowest Score</div>
            <div className="stat-value">{stats.low}%</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Total Attempts</div>
            <div className="stat-value">{stats.attempts}</div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="analytics-card p-6">
          <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-main)' }}>Score History</h3>
          <div className="chart-container">
            {filteredData.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <span className="text-5xl mb-4">📊</span>
                <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>Not enough data to display analytics.</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or taking more quizzes.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
