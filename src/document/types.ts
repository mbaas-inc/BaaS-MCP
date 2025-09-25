export interface RawDocs {
  text: string;
  title: string;
  link: string;
  description: string;
}

export interface DocumentMetadata {
  title: string;
  description: string;
  keywords: string[];
}

export interface MarkdownDocument {
  content: string;
  metadata: DocumentMetadata;
  url: string;
}

export interface DocumentChunk {
  id: number;
  chunkId: number;
  originTitle: string;
  text: string; // 컨텍스트 포함 전체 텍스트
  rawText: string; // 원본 텍스트만
  wordCount: number;
  estimatedTokens: number; // 컨텍스트 포함 토큰 수
  headerStack: string[]; // 헤더 경로
}