export class BaaSDocument {
    keywordSet;
    document;
    documentId;
    category;
    constructor(keywordSet, document, documentId, category) {
        this.keywordSet = keywordSet;
        this.document = document;
        this.documentId = documentId;
        this.category = category;
    }
    getId() {
        return this.documentId;
    }
    getCategory() {
        return this.category;
    }
    getTitle() {
        return this.document.metadata.title;
    }
    getDescription() {
        return this.document.metadata.description;
    }
    getUrl() {
        return this.document.url;
    }
    getContent() {
        return this.document.content;
    }
    getKeywords() {
        return this.keywordSet;
    }
    getMetadataKeywords() {
        return this.document.metadata.keywords;
    }
    hasKeyword(keyword) {
        const normalizedKeyword = keyword.toLowerCase().trim();
        return this.keywordSet.has(normalizedKeyword) ||
            this.document.content.toLowerCase().includes(normalizedKeyword);
    }
    // Calculate relevance score for BM25 algorithm
    calculateRelevance(queryTerms, documentFreq, totalDocs) {
        const k1 = 1.2;
        const b = 0.75;
        const avgDocLength = 1000; // Approximate average document length
        const docLength = this.document.content.length;
        let score = 0;
        for (const term of queryTerms) {
            const termLower = term.toLowerCase();
            // Term frequency in document
            const tf = this.getTermFrequency(termLower);
            if (tf === 0)
                continue;
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
    getTermFrequency(term) {
        const content = this.document.content.toLowerCase();
        const regex = new RegExp(`\\b${term}\\b`, 'g');
        const matches = content.match(regex);
        return matches ? matches.length : 0;
    }
    // Extract relevant chunks for the query
    getRelevantChunks(queryTerms, maxChunks = 3) {
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
    scoreChunk(chunk, queryTerms) {
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
            }
            else {
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
//# sourceMappingURL=baas-document.js.map