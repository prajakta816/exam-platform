import axios from "axios";
import { NEWS_API_KEY } from "../config/env.js";
import TryCatch from "../utils/TryCatch.js";

const NEWS_CACHE_TTL_MS = 30 * 60 * 1000;
const NEWS_QUERY = "AI OR engineering OR software OR technology";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b";
let cachedDailyNews = null;
let cachedAt = 0;

// Rotating news content pool (Fallback)
const NEWS_POOL = [
  { title: "AI in Education", description: "New government policy aims to integrate AI tutors in primary schools by 2025.", url: "https://www.bbc.com/news/technology", urlToImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e" },
  { title: "Green Energy Surge", description: "India's solar capacity grows by 25% in the last quarter, surpassing expectations.", url: "https://www.techcrunch.com", urlToImage: "https://images.unsplash.com/photo-1509391366360-fe5bb6585828" },
  { title: "Digital Rupee Trial", description: "RBI expands CBDC pilot to include 5 more cities and 3 more banks.", url: "https://www.reuters.com/technology", urlToImage: "https://images.unsplash.com/photo-1621504450181-5d356f63d3ee" }
];

const stripHtml = (value = "") =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const decodeXml = (value = "") =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const readXmlTag = (item, tag) => {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
};

const normalizeArticle = (article) => ({
  title: stripHtml(article.title),
  description: stripHtml(article.description || article.content || article.source?.name || ""),
  url: article.url || article.link,
  urlToImage: article.urlToImage || article.image || DEFAULT_IMAGE,
  publishedAt: article.publishedAt || article.pubDate || new Date().toISOString(),
  source: article.source?.name || article.source || "News"
});

const getFallbackNews = () => {
  const day = new Date().getDate();
  const startIndex = day % NEWS_POOL.length;
  const selectedNews = [];

  for (let i = 0; i < 3; i++) {
    const item = NEWS_POOL[(startIndex + i) % NEWS_POOL.length];
    selectedNews.push({
      ...item,
      publishedAt: new Date().toISOString(),
      source: "Offline"
    });
  }

  return {
    headline: "Trending Knowledge (Offline Mode)",
    news: selectedNews,
    timestamp: new Date().toISOString(),
    isMock: true
  };
};

const fetchNewsApiArticles = async () => {
  const response = await axios.get("https://newsapi.org/v2/everything", {
    params: {
      q: NEWS_QUERY,
      language: "en",
      sortBy: "publishedAt",
      pageSize: 9,
      apiKey: NEWS_API_KEY
    },
    timeout: 8000
  });

  return response.data.articles || [];
};

const fetchGoogleRssArticles = async () => {
  const rssUrl = "https://news.google.com/rss/search";
  const response = await axios.get(rssUrl, {
    params: {
      q: `${NEWS_QUERY} when:1d`,
      hl: "en-IN",
      gl: "IN",
      ceid: "IN:en"
    },
    timeout: 8000,
    responseType: "text"
  });

  return [...response.data.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => {
    const item = match[1];
    const source = readXmlTag(item, "source");
    const description = readXmlTag(item, "description");

    return {
      title: readXmlTag(item, "title"),
      description: stripHtml(description).replace(/\s+-\s+[^-]+$/, ""),
      link: readXmlTag(item, "link"),
      pubDate: readXmlTag(item, "pubDate"),
      source: stripHtml(source)
    };
  });
};

export const getDailyContent = TryCatch(async (req, res) => {
  if (cachedDailyNews && Date.now() - cachedAt < NEWS_CACHE_TTL_MS) {
    return res.json(cachedDailyNews);
  }

  const isMock = !NEWS_API_KEY || NEWS_API_KEY === "your_api_key_here";
  let articles = [];
  let source = "Google News";

  if (!isMock) {
    try {
      articles = await fetchNewsApiArticles();
      source = "NewsAPI";
    } catch (error) {
      console.warn("NewsAPI error, trying RSS news:", error.message);
    }
  }

  if (!articles.length) {
    try {
      articles = await fetchGoogleRssArticles();
    } catch (error) {
      console.warn("RSS news error, falling back to offline content:", error.message);
    }
  }

  const news = articles
    .map(normalizeArticle)
    .filter((article) => article.title && article.url)
    .slice(0, 6);

  if (!news.length) {
    return res.json(getFallbackNews());
  }

  cachedDailyNews = {
    headline: "Today's AI & Engineering News",
    news,
    timestamp: new Date().toISOString(),
    source,
    isMock: false
  };
  cachedAt = Date.now();

  res.json(cachedDailyNews);
});
