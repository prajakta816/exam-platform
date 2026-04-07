// 🆕 NEW FILE

export const safeParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return []; // prevents crash
  }
};