// 🔄 SENIOR DEV VERSION: Robust JSON Parsing

export const safeParse = (text) => {
  if (!text) return [];

  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    try {
      // 2. Handle Markdown code blocks if present
      const jsonRegex = /```json\s?([\s\S]*?)\s?```/;
      const match = text.match(jsonRegex);
      if (match && match[1]) {
        return JSON.parse(match[1].trim());
      }

      // 3. Last ditch: try to find anything between [ ] or { }
      const arrMatch = text.match(/\[\s*{[\s\S]*}\s*\]/);
      if (arrMatch) {
        return JSON.parse(arrMatch[0]);
      }

      const objMatch = text.match(/{\s*[\s\S]*\s*}/);
      if (objMatch) {
        return JSON.parse(objMatch[0]);
      }

    } catch (innerError) {
      console.error("Critical JSON Parse Failure:", innerError.message);
    }
    
    console.error("AI returned malformed JSON:", text);
    return [];
  }
};