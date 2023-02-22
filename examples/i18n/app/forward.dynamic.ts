import { DynamicForwarder } from "next-app-middleware/runtime";

const available = ["en", "de"];

const validateCookie = (value?: string) => {
  if (!value) return;
  if (available.includes(value)) return value;
  return "en";
};

const matchAcceptLanguageHeader = (header: string | null) => {
  if (!header) return "en";
  const values = header.split(",");
  const match = {
    score: 0,
    laguage: "en",
  };
  for (const value of values) {
    const [lang, score = "1"] = value.trim().split(";q=");
    const parsedScore = parseFloat(score);
    if (
      (lang === "*" || available.includes(lang)) &&
      parsedScore > match.score
    ) {
      match.score = parsedScore;
      match.laguage = lang === "*" ? "en" : lang;
    }
  }
  return match.laguage;
};

export const locale: DynamicForwarder = (req) => {
  return (
    validateCookie(req.cookies.get("locale")?.value) ||
    matchAcceptLanguageHeader(req.headers.get("accept-language"))
  );
};
