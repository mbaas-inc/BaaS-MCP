import { categories } from "./types.js";
export class MarkdownDocumentFetcher {
    async fetch(url) {
        try {
            const response = await fetch(url, {
                headers: {
                    "user-agent": "AIApp BaaS MCP Server",
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch document: ${response.statusText}`);
            }
            const content = await response.text();
            const metadata = this.extractMetadata(content, url);
            return {
                content,
                metadata,
                url,
            };
        }
        catch (error) {
            console.error(`Error fetching document from ${url}:`, error);
            throw error;
        }
    }
    extractMetadata(content, url) {
        const lines = content.split('\n');
        let title = '';
        let description = '';
        const keywords = [];
        // Extract title from first h1 heading
        for (const line of lines.slice(0, 20)) {
            if (line.startsWith('# ')) {
                title = line.substring(2).trim();
                break;
            }
        }
        // Extract description from first paragraph or second heading
        for (const line of lines.slice(0, 30)) {
            if (line.trim() && !line.startsWith('#') && !line.startsWith('```') && line.length > 20) {
                description = line.trim();
                break;
            }
        }
        // Extract keywords from content
        const keywordSources = [
            title,
            description,
            this.extractCodeBlocks(content),
            this.extractHeadings(content)
        ].filter(Boolean);
        for (const source of keywordSources) {
            const extractedKeywords = this.extractKeywordsFromText(source);
            keywords.push(...extractedKeywords);
        }
        // Add URL-based keywords
        const urlKeywords = this.extractKeywordsFromUrl(url);
        keywords.push(...urlKeywords);
        // Remove duplicates and filter
        const uniqueKeywords = Array.from(new Set(keywords))
            .filter(keyword => keyword.length > 2 && keyword.length < 50);
        const category = this.extractCategoryFromUrl(url);
        return {
            title: title || 'Untitled',
            description: description || '',
            keywords: uniqueKeywords,
            category,
        };
    }
    extractCodeBlocks(content) {
        const codeBlockRegex = /```[\s\S]*?```/g;
        const codeBlocks = content.match(codeBlockRegex) || [];
        return codeBlocks.join(' ');
    }
    extractHeadings(content) {
        const lines = content.split('\n');
        const headings = lines
            .filter(line => line.match(/^#{1,6}\s/))
            .map(line => line.replace(/^#{1,6}\s/, '').trim());
        return headings.join(' ');
    }
    extractKeywordsFromText(text) {
        // Remove code blocks and special characters
        const cleanText = text
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/[^\w\s가-힣]/g, ' ');
        // Split and filter keywords
        const words = cleanText
            .split(/\s+/)
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length > 2);
        // Add common technical terms
        const technicalTerms = [
            'api', 'jwt', 'token', 'cookie', 'auth', 'login', 'signup',
            'react', 'vue', 'nextjs', 'javascript', 'typescript', 'cors',
            'http', 'https', 'json', 'fetch', 'axios', 'express',
            'security', 'encryption', 'validation', 'error', 'response'
        ];
        const foundTerms = technicalTerms.filter(term => cleanText.toLowerCase().includes(term));
        return [...words, ...foundTerms];
    }
    extractKeywordsFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname
                .split('/')
                .filter(part => part.length > 0)
                .map(part => part.replace(/[-_]/g, ' ').toLowerCase());
            return pathParts;
        }
        catch (error) {
            return [];
        }
    }
    extractCategoryFromUrl(url) {
        try {
            const urlObj = new URL(url);
            for (const category of categories) {
                if (urlObj.pathname.includes(`/${category}/`)) {
                    return category;
                }
            }
            return "unknown";
        }
        catch (error) {
            return "unknown";
        }
    }
}
//# sourceMappingURL=markdown-document.fetcher.js.map