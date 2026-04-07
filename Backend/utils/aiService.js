// 🔄 UPDATED

import axios from "axios";
import { safeParse } from "./safeParse.js"; // 🆕 added

export const generateMCQ = async (text) => {
  const prompt = `
Generate 5 MCQs in JSON format:
${text}
`;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  const content = response.data.choices[0].message.content;

  return safeParse(content); // ✅ UPDATED
};