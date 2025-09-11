import { MarkdownDocument, Category, DocumentChunk } from "./types.js";

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
    const content = this.document.content;
    const sections = this.splitIntoSections(content);
    
    let chunkId = 0;
    sections.forEach((section, index) => {
      if (section.text.trim().length > 100) {
        const chunk: DocumentChunk = {
          id: this.documentId,
          chunkId: chunkId++,
          originTitle: this.document.metadata.title,
          text: this.addContext(section.text, section.header),
          rawText: section.text,
          wordCount: this.countWords(section.text),
          estimatedTokens: this.estimateTokens(section.text),
          headerStack: section.headerStack,
          category: this.category
        };
        this.chunks.push(chunk);
      }
    });
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

  private addContext(text: string, header: string): string {
    return `# ${header}\n\n${text}`;
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private estimateTokens(text: string): number {
    // 대략적인 토큰 수 추정 (영어: 4자/토큰, 한국어: 2자/토큰)
    const englishChars = text.match(/[a-zA-Z\s]/g)?.length || 0;
    const koreanChars = text.match(/[가-힣]/g)?.length || 0;
    const otherChars = text.length - englishChars - koreanChars;
    
    return Math.ceil(englishChars / 4 + koreanChars / 2 + otherChars / 3);
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