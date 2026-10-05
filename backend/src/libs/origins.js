// CLIENT_URL có thể là nhiều url, ngăn cách bằng dấu phẩy
export const getAllowedOrigins = () => {
  const list = (process.env.CLIENT_URL || "")
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const withWww = list
    .filter((url) => url.startsWith("https://") && !url.includes("://www."))
    .map((url) => url.replace("https://", "https://www."));

  return [...new Set([...list, ...withWww])];
};
