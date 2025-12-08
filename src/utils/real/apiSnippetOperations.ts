import axios, { AxiosInstance, AxiosRequestHeaders } from "axios";
import { ComplianceEnum, CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet } from "../snippet";
import { PaginatedUsers } from "../users";
import { TestCase } from "../../types/TestCase";
import { TestCaseResult } from "../queries";
import { FileType } from "../../types/FileType";
import { Rule } from "../../types/Rule";
import { SnippetOperations } from "../snippetOperations";
import * as snippetApi from "../../api/snippet";
import * as userApi from "../../api/user";
import * as languageApi from "../../api/language";
import { SnippetUploadDTO, SubmitSnippetDTO } from "../../api/types";

type GetToken = () => Promise<string>;

export class ApiSnippetOperations implements SnippetOperations {
  private readonly client: AxiosInstance;
  private readonly getToken: GetToken;

  constructor(getAccessTokenSilently: GetToken) {
    this.getToken = getAccessTokenSilently;
    this.client = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8080",
    });

    this.client.interceptors.request.use(async (config) => {
      try {
        const token = await this.getToken();
        const headers = (config.headers ?? {}) as AxiosRequestHeaders;
        headers.Authorization = `Bearer ${token}`;
        config.headers = headers;
      } catch (e) {
        console.error("Error obteniendo token", e);
      }
      return config;
    });
  }

  async listSnippetDescriptors(page: number, pageSize: number, snippetName?: string): Promise<PaginatedSnippets> {
    const snippets = await snippetApi.getAllSnippets(this.client, {
      page,
      size: pageSize,
      name: snippetName
    });
    
    return {
      page,
      page_size: pageSize,
      count: 100, // Backend doesn't return total count yet
      snippets: snippets.map(s => ({
        id: s.id,
        name: s.name,
        content: "", // List doesn't return content
        language: s.language,
        extension: "txt", // Should infer from language
        compliance: (s.conformance?.toLowerCase() as ComplianceEnum) || 'pending',
        author: s.ownerId
      }))
    };
  }

  async createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {
    const dto: SnippetUploadDTO = {
      name: createSnippet.name,
      language: createSnippet.language,
      version: "1.0.0",
      description: "Created via Web UI",
    };

    const response = await snippetApi.uploadSnippetInline(this.client, createSnippet.content, dto);
    
    return {
      id: response.id || "temp-id",
      name: createSnippet.name,
      content: createSnippet.content,
      language: createSnippet.language,
      extension: createSnippet.extension,
      compliance: "pending",
      author: "Me",
    };
  }

  async getSnippetById(id: string): Promise<Snippet | undefined> {
    try {
        const [metadata, content] = await Promise.all([
            snippetApi.getSnippetMetadata(this.client, id),
            snippetApi.getSnippetContent(this.client, id)
        ]);

        return {
          id: metadata.id,
          name: metadata.name,
          content: content,
          language: metadata.language,
          extension: "txt",
          compliance: (metadata.conformance?.toLowerCase() as ComplianceEnum) || 'pending',
          author: metadata.ownerId,
        };
    } catch (e) {
        console.error("Error fetching snippet", e);
        return undefined;
    }
  }

  async updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet> {
    const current = await this.getSnippetById(id);
    if (!current) throw new Error("Snippet not found");

    const dto: SubmitSnippetDTO = {
      code: updateSnippet.content,
      name: current.name,
      language: current.language,
      langVersion: "1.0.0", 
      description: "Updated via Web UI",
    };

    await snippetApi.updateSnippet(this.client, id, dto);
    
    return {
        ...current,
        content: updateSnippet.content
    };
  }

  async getUserFriends(name?: string, page?: number, pageSize?: number): Promise<PaginatedUsers> {
    const users = await userApi.searchUsers(this.client, name || "");
    return {
      page: page || 0,
      page_size: pageSize || 10,
      count: users.length,
      users: users.map(u => ({
        id: u.id,
        name: u.email
      }))
    };
  }

  async shareSnippet(snippetId: string, userId: string): Promise<Snippet> {
    await snippetApi.shareSnippet(this.client, snippetId, userId);
    const s = await this.getSnippetById(snippetId);
    return s!;
  }

  async deleteSnippet(id: string): Promise<string> {
    await snippetApi.deleteSnippet(this.client, id);
    return id;
  }

  async getFileTypes(): Promise<FileType[]> {
    const languages = await languageApi.getSupportedLanguages(this.client);
    return languages.map(l => ({
      language: l.name,
      extension: l.extension
    }));
  }

  async getFormatRules(): Promise<Rule[]> { return []; }
  async getLintingRules(): Promise<Rule[]> { return []; }
  async getTestCases(): Promise<TestCase[]> { return []; }
  
  async formatSnippet(id: string): Promise<string> { 
    await snippetApi.formatSnippet(this.client, id);
    const content = await snippetApi.getSnippetContent(this.client, id);
    return content;
  }

  async lintSnippet(id: string): Promise<string> {
    const result = await snippetApi.lintSnippet(this.client, id);
    return result;
  }

  async downloadSnippet(id: string): Promise<Blob> {
    return await snippetApi.downloadSnippetBlob(this.client, id);
  }

  async postTestCase(testCase: Partial<TestCase>): Promise<TestCase> { throw new Error("Not implemented in backend"); }
  async removeTestCase(id: string): Promise<string> { return id; }
  async testSnippet(testCase: Partial<TestCase>): Promise<TestCaseResult> { 
      console.warn("Testing backend endpoint not connected");
      return "fail"; 
  }
  async modifyFormatRule(newRules: Rule[]): Promise<Rule[]> { return newRules; }
  async modifyLintingRule(newRules: Rule[]): Promise<Rule[]> { return newRules; }
}
