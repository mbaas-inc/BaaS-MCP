import {RawDocs} from "./types.js";

export function parseLLMText(text: string): RawDocs[] {
  return text
    .split("\n")
    .filter((line) => line.includes("https://docs.aiapp.link"))
    .map((line) => parse({ text: line, link: extractLink(line) }));
}

function extractLink(line: string): string {
  const start = line.indexOf("](");
  const end = line.indexOf(")", start);
  return line.substring(start + 2, end);
}

function parse(link: { text: string; link: string }): RawDocs {
  const { text, link: url } = link;
  const title = extractTitle(text);
  const description = extractDescription(text);

  return {
    text,
    title,
    link: url,
    description,
  };
}

function extractTitle(text: string): string {
  const start = text.indexOf("[") + 1;
  const end = text.indexOf("](", start);
  return text.substring(start, end).trim();
}

function extractDescription(text: string): string {
  const colonIndex = text.indexOf("):");
  if (colonIndex === -1) {
    return "";
  }
  const start = colonIndex + 2;
  return text.substring(start).trim();
}

