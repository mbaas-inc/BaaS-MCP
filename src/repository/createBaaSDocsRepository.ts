import {MarkdownDocumentFetcher} from "../document/markdown-document.fetcher.js";
import {parseLLMText} from "../document/parseLLMText.js";
import {BaaSDocumentLoader} from "../document/baas-document.loader.js";
import {BaaSDocsRepository} from "./baas-docs.repository.js";
import {COMMON_DOCS_URLS} from "../constants/common-docs.js";

/**
 * Common 문서를 별도로 로드하는 헬퍼 함수
 * RawDocs 형식으로 반환 (BaaSDocumentLoader가 fetch를 처리)
 */
function loadCommonDocs(): any[] {
  try {
    return COMMON_DOCS_URLS.map((url) => {
      // URL에서 파일명 추출하여 title로 사용
      const filename = url.split('/').pop() || 'unknown.md';
      const title = filename.replace('.md', '').replace(/-/g, ' ');

      // parseLLMText와 동일한 RawDocs 형식으로 반환
      return {
        text: `[${title}](${url})`,
        title: title,
        link: url,
        description: '' // Common 문서는 설명 없이
      };
    });
  } catch (error) {
    console.error('Failed to load common docs:', error);
    return [];
  }
}

export async function createBaaSDocsRepository(
  link = "https://docs.aiapp.link/llms.txt"
): Promise<BaaSDocsRepository> {
  try {
    // 1. llms.txt에서 기능 문서 로드
    const urlWithTimestamp = `${link}?t=${Date.now()}`;

    const response = await fetch(urlWithTimestamp, {
      headers: {
        "user-agent": "AIApp BaaS MCP Server",
        "cache-control": "no-cache, no-store, must-revalidate",
        "pragma": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch LLM text: ${response.statusText}`);
    }

    const llmText = await response.text();
    const featureRawDocs = parseLLMText(llmText);

    // 2. Common 문서 별도 로드
    const commonRawDocs = loadCommonDocs();

    // 3. 기능 문서 로드
    const featureLoader = new BaaSDocumentLoader(
      featureRawDocs,
      new MarkdownDocumentFetcher()
    );
    await featureLoader.load();
    const featureDocs = featureLoader.getDocuments();

    // 4. Common 문서 로드
    const commonLoader = new BaaSDocumentLoader(
      commonRawDocs,
      new MarkdownDocumentFetcher()
    );
    await commonLoader.load();
    const commonDocs = commonLoader.getDocuments();

    return new BaaSDocsRepository(featureDocs, commonDocs);
  } catch (error) {
    console.error('Failed to create BaaS docs repository:', error);
    // Return empty repository as fallback
    return new BaaSDocsRepository([]);
  }
}