import { MarkdownDocument, Category, DocumentChunk } from "./types.js";
import { TokenEstimator } from "./token-estimator.js";

export class BaaSDocument {
  private chunks: DocumentChunk[] = [];

  constructor(
    private readonly keywordSet: Set<string>,
    private readonly document: MarkdownDocument,
    private readonly documentId: number,
    private readonly category: Category
  ) {
    this.generateChunks();
  }

  getId(): number {
    return this.documentId;
  }

  getCategory(): Category {
    return this.category;
  }

  getTitle(): string {
    return this.document.metadata.title;
  }

  getDescription(): string {
    return this.document.metadata.description;
  }

  getUrl(): string {
    return this.document.url;
  }

  getContent(): string {
    return this.document.content;
  }

  getKeywords(): Set<string> {
    return this.keywordSet;
  }

  getMetadataKeywords(): string[] {
    return this.document.metadata.keywords;
  }

  getChunks(): DocumentChunk[] {
    return this.chunks;
  }

  private generateChunks(): void {
    const MAX_TOKENS_PER_CHUNK = 2000;
    const content = this.document.content;
    const estimatedTokens = this.estimateTokens(content);
    
    // 작은 문서는 단일 청크로 처리
    if (estimatedTokens <= MAX_TOKENS_PER_CHUNK) {
      this.chunks.push({
        id: this.documentId,
        chunkId: 0,
        originTitle: this.document.metadata.title,
        text: this.addContext(content, this.document.metadata.title),
        rawText: content,
        wordCount: this.countWords(content),
        estimatedTokens: estimatedTokens,
        headerStack: [this.document.metadata.title],
        category: this.category
      });
    } else {
      // 토큰 기반으로 문서를 청킹
      const sections = this.splitIntoSections(content);
      const chunks = this.splitByTokenLimit(sections, MAX_TOKENS_PER_CHUNK);
      
      chunks.forEach((chunk, index) => {
        this.chunks.push({
          id: this.documentId,
          chunkId: index,
          originTitle: this.document.metadata.title,
          text: this.addContext(chunk.text, chunk.header),
          rawText: chunk.text,
          wordCount: this.countWords(chunk.text),
          estimatedTokens: this.estimateTokens(chunk.text),
          headerStack: chunk.headerStack,
          category: this.category
        });
      });
    }
  }

  private splitIntoSections(content: string): { text: string; header: string; headerStack: string[] }[] {
    const sections: { text: string; header: string; headerStack: string[] }[] = [];
    const lines = content.split('\n');
    
    let currentSection = '';
    let currentHeader = this.document.metadata.title;
    let headerStack: string[] = [this.document.metadata.title];
    
    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s*(.+)$/);
      
      if (headingMatch) {
        // Save previous section
        if (currentSection.trim()) {
          sections.push({
            text: currentSection.trim(),
            header: currentHeader,
            headerStack: [...headerStack]
          });
        }
        
        // Start new section
        const level = headingMatch[1].length;
        const title = headingMatch[2].trim();
        
        // Update header stack
        headerStack = headerStack.slice(0, level);
        headerStack[level - 1] = title;
        
        currentHeader = title;
        currentSection = line + '\n';
      } else {
        currentSection += line + '\n';
      }
    }
    
    // Add last section
    if (currentSection.trim()) {
      sections.push({
        text: currentSection.trim(),
        header: currentHeader,
        headerStack: [...headerStack]
      });
    }
    
    return sections;
  }

  /**
   * 섹션들을 토큰 제한에 맞춰 청크로 분할
   */
  private splitByTokenLimit(
    sections: { text: string; header: string; headerStack: string[] }[], 
    maxTokens: number
  ): { text: string; header: string; headerStack: string[] }[] {
    const chunks: { text: string; header: string; headerStack: string[] }[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let currentHeader = this.document.metadata.title;
    let currentHeaderStack = [this.document.metadata.title];
    
    for (const section of sections) {
      // 섹션 텍스트 길이 확인 (100자 미만은 스킵)
      if (section.text.trim().length < 100) continue;
      
      const sectionTokens = this.estimateTokens(section.text);
      
      // 단일 섹션이 토큰 제한을 초과하는 경우
      if (sectionTokens > maxTokens) {
        // 현재 청크가 있으면 저장
        if (currentChunk.trim()) {
          chunks.push({
            text: currentChunk.trim(),
            header: currentHeader,
            headerStack: [...currentHeaderStack]
          });
        }
        
        // 큰 섹션을 문단별로 분할
        const paragraphs = this.splitSectionByParagraphs(section, maxTokens);
        chunks.push(...paragraphs);
        
        // 리셋
        currentChunk = '';
        currentTokens = 0;
        continue;
      }
      
      // 현재 청크에 섹션 추가 가능한지 확인
      if (currentTokens + sectionTokens > maxTokens && currentChunk.trim()) {
        // 현재 청크 저장
        chunks.push({
          text: currentChunk.trim(),
          header: currentHeader,
          headerStack: [...currentHeaderStack]
        });
        
        // 새 청크 시작
        currentChunk = section.text;
        currentTokens = sectionTokens;
        currentHeader = section.header;
        currentHeaderStack = section.headerStack;
      } else {
        // 현재 청크에 추가
        if (currentChunk) {
          currentChunk += '\n\n' + section.text;
        } else {
          currentChunk = section.text;
          currentHeader = section.header;
          currentHeaderStack = section.headerStack;
        }
        currentTokens += sectionTokens;
      }
    }
    
    // 마지막 청크 저장
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        header: currentHeader,
        headerStack: [...currentHeaderStack]
      });
    }
    
    return chunks;
  }

  /**
   * 큰 섹션을 문단별로 분할
   */
  private splitSectionByParagraphs(
    section: { text: string; header: string; headerStack: string[] },
    maxTokens: number
  ): { text: string; header: string; headerStack: string[] }[] {
    const paragraphs = section.text.split('\n\n').filter(p => p.trim().length > 0);
    const chunks: { text: string; header: string; headerStack: string[] }[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    
    for (const paragraph of paragraphs) {
      const paragraphTokens = this.estimateTokens(paragraph);
      
      if (currentTokens + paragraphTokens > maxTokens && currentChunk.trim()) {
        chunks.push({
          text: currentChunk.trim(),
          header: section.header,
          headerStack: [...section.headerStack]
        });
        currentChunk = paragraph;
        currentTokens = paragraphTokens;
      } else {
        if (currentChunk) {
          currentChunk += '\n\n' + paragraph;
        } else {
          currentChunk = paragraph;
        }
        currentTokens += paragraphTokens;
      }
    }
    
    // 마지막 청크
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        header: section.header,
        headerStack: [...section.headerStack]
      });
    }
    
    return chunks;
  }

  private addContext(text: string, header: string): string {
    return `# ${header}\n\n${text}`;
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private estimateTokens(text: string): number {
    return TokenEstimator.estimate(text);
  }

  hasKeyword(keyword: string): boolean {
    const normalizedKeyword = keyword.toLowerCase().trim();
    return this.keywordSet.has(normalizedKeyword) || 
           this.document.content.toLowerCase().includes(normalizedKeyword);
  }

  // Calculate relevance score for BM25 algorithm
  calculateRelevance(queryTerms: string[], documentFreq: Map<string, number>, totalDocs: number): number {
    const k1 = 1.2;
    const b = 0.75;
    const avgDocLength = 1000; // Approximate average document length
    const docLength = this.document.content.length;

    let score = 0;

    for (const term of queryTerms) {
      const termLower = term.toLowerCase();
      
      // Term frequency in document
      const tf = this.getTermFrequency(termLower);
      if (tf === 0) continue;

      // Document frequency
      const df = documentFreq.get(termLower) || 1;
      
      // Inverse document frequency
      const idf = Math.log((totalDocs - df + 0.5) / (df + 0.5));
      
      // BM25 formula
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));
      
      score += idf * (numerator / denominator);
    }

    return score;
  }

  private getTermFrequency(term: string): number {
    const content = this.document.content.toLowerCase();
    const regex = new RegExp(`\\b${term}\\b`, 'g');
    const matches = content.match(regex);
    return matches ? matches.length : 0;
  }

  // Extract relevant chunks for the query
  getRelevantChunks(queryTerms: string[], maxChunks: number = 3): string[] {
    const paragraphs = this.document.content
      .split('\n\n')
      .filter(p => p.trim().length > 50);

    const scoredParagraphs = paragraphs.map(paragraph => ({
      paragraph,
      score: this.scoreChunk(paragraph, queryTerms)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);

    return scoredParagraphs.map(item => item.paragraph.trim());
  }

  private scoreChunk(chunk: string, queryTerms: string[]): number {
    const chunkLower = chunk.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      const termLower = term.toLowerCase();
      
      // Count occurrences
      const regex = new RegExp(`\\b${termLower}\\b`, 'g');
      const matches = chunkLower.match(regex);
      const termCount = matches ? matches.length : 0;
      
      // Boost score for title/heading context
      if (chunk.includes('#')) {
        score += termCount * 2;
      } else {
        score += termCount;
      }
      
      // Boost for code blocks
      if (chunk.includes('```')) {
        score += termCount * 1.5;
      }
    }

    return score;
  }

  toJSON() {
    return {
      id: this.documentId,
      title: this.getTitle(),
      description: this.getDescription(),
      url: this.getUrl(),
      category: this.category,
      keywords: Array.from(this.keywordSet)
    };
  }
}