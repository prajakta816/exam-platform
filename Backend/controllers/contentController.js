import axios from "axios";
import { NEWS_API_KEY } from "../config/env.js";
import TryCatch from "../utils/TryCatch.js";

// Rotating news content pool (Fallback)
const NEWS_POOL = [
  { title: "AI in Education", description: "New government policy aims to integrate AI tutors in primary schools by 2025.", url: "https://www.bbc.com/news/technology", urlToImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e" },
  { title: "Green Energy Surge", description: "India's solar capacity grows by 25% in the last quarter, surpassing expectations.", url: "https://www.techcrunch.com", urlToImage: "https://images.unsplash.com/photo-1509391366360-fe5bb6585828" },
  { title: "Digital Rupee Trial", description: "RBI expands CBDC pilot to include 5 more cities and 3 more banks.", url: "https://www.reuters.com/technology", urlToImage: "https://images.unsplash.com/photo-1621504450181-5d356f63d3ee" }
];

export const getDailyContent = TryCatch(async (req, res) => {
  const isMock = !NEWS_API_KEY || NEWS_API_KEY === "your_api_key_here";

  if (!isMock) {
    try {
      const response = await axios.get("https://newsapi.org/v2/everything", {
        params: {
          q: "AI OR engineering OR software",
          language: "en",
          sortBy: "publishedAt",
          pageSize: 6,
          apiKey: NEWS_API_KEY
        }
      });

      if (response.data.articles) {
        return res.json({
          headline: "Today's AI & Engineering News",
          news: response.data.articles.map(a => ({
            title: a.title,
            description: a.description,
            url: a.url,
            urlToImage: a.urlToImage || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
            publishedAt: a.publishedAt
          })),
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.warn("NewsAPI Error, falling back to mock:", error.message);
    }
  }

  // Fallback Logic
  const day = new Date().getDate();
  const startIndex = day % NEWS_POOL.length;
  const selectedNews = [];
  
  for (let i = 0; i < 3; i++) {
    const item = NEWS_POOL[(startIndex + i) % NEWS_POOL.length];
    selectedNews.push({
      ...item,
      publishedAt: new Date().toISOString()
    });
  }

  res.json({
    headline: "Trending Knowledge (Offline Mode)",
    news: selectedNews,
    timestamp: new Date(),
    isMock: true
  });
});
