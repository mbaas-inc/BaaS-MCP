import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { BaaSDocsRepository } from "../repository/baas-docs.repository.js";
import { Category } from "../document/types.js";
export declare function createSearchDocumentsTool(repository: BaaSDocsRepository, projectId?: string | null): {
    inputSchema: {
        type: "object";
        properties: {
            query: {
                type: string;
                description: string;
            };
            category: {
                type: string;
                enum: Category[];
                description: string;
            };
            limit: {
                type: string;
                description: string;
                minimum: number;
                maximum: number;
            };
        };
        required: string[];
    };
    handler: (args: any) => Promise<CallToolResult>;
};
export declare function createGetDocumentByIdTool(repository: BaaSDocsRepository, projectId?: string | null): {
    inputSchema: {
        type: "object";
        properties: {
            id: {
                type: string;
                description: string;
            };
            includeMetadata: {
                type: string;
                description: string;
                default: boolean;
            };
        };
        required: string[];
    };
    handler: (args: any) => Promise<CallToolResult>;
};
export declare function createGetDocumentsByCategory(repository: BaaSDocsRepository): {
    inputSchema: {
        type: "object";
        properties: {
            category: {
                type: string;
                enum: Category[];
                description: string;
            };
            limit: {
                type: string;
                description: string;
                minimum: number;
                maximum: number;
            };
        };
        required: string[];
    };
    handler: (args: any) => Promise<CallToolResult>;
};
//# sourceMappingURL=document-search.tools.d.ts.map