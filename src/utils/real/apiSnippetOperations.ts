import axios, {AxiosInstance, AxiosRequestHeaders} from "axios";
import {CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet} from "../snippet";
import {PaginatedUsers} from "../users";
import {TestCase} from "../../types/TestCase";
import {TestCaseResult} from "../queries";
import {FileType} from "../../types/FileType";
import {Rule} from "../../types/Rule";
import {SnippetOperations} from "../snippetOperations";

type GetToken = () => Promise<string>;

const DEFAULT_VERSION = "1.0";
export class ApiSnippetOperations implements SnippetOperations {
  private readonly client: AxiosInstance;
  private readonly getToken: GetToken;

  constructor(getAccessTokenSilently: GetToken) {
    this.getToken = getAccessTokenSilently;
    this.client = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL,
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await this.getToken();
      const headers = (config.headers ?? {}) as AxiosRequestHeaders;
      headers.Authorization = `Bearer ${token}`;
      config.headers = headers;
      return config;
    });
  }

  async listSnippetDescriptors(page: number, pageSize: number, snippetName?: string): Promise<PaginatedSnippets> {
    throw new Error(`listSnippetDescriptors not implemented yet on snippet-service ${page}, ${pageSize}, ${snippetName}`);
  }

  async createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {
    const {content, name, language} = createSnippet;
    const formData = new FormData();
    formData.append("code", content);
    formData.append("name", name);
    formData.append("language", language);
    formData.append("version", DEFAULT_VERSION);
    formData.append("description", "");
    formData.append("versionTag", "");

    await this.client.post("/snippets/upload-inline", formData);

    // snippet-service does not return the created snippet shape yet.
    return {
      id: crypto.randomUUID(),
      name,
      content,
      language,
      extension: "ps",
      compliance: "pending",
      author: "unknown",
    };
  }

  async getSnippetById(id: string): Promise<Snippet | undefined> {
    throw new Error(`getSnippetById not implemented yet on snippet-service ${id}`);
  }

  async updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet> {
    const formData = new FormData();
    formData.append("snippetName", id);
    formData.append("newCode", updateSnippet.content);

    await this.client.post("/snippets/update-inline", formData);

    return {
      id,
      name: id,
      content: updateSnippet.content,
      language: "printscript",
      extension: "ps",
      compliance: "pending",
      author: "unknown",
    };
  }

  async getUserFriends(): Promise<PaginatedUsers> {
    // No users endpoint available yet.
    return Promise.resolve({
      page: 0,
      page_size: 0,
      count: 0,
      users: [],
    });
  }

  async shareSnippet(snippetId: string, userId: string): Promise<Snippet> {
    throw new Error(`shareSnippet not implemented yet on snippet-service ${snippetId}, ${userId}`);
  }

  async getFormatRules(): Promise<Rule[]> {
    return [];
  }

  async getLintingRules(): Promise<Rule[]> {
    return [];
  }

  async getTestCases(): Promise<TestCase[]> {
    return [];
  }

  async formatSnippet(snippet: string): Promise<string> {
    throw new Error(`formatSnippet not implemented yet on snippet-service ${snippet}`);
  }

  async postTestCase(): Promise<TestCase> {
    return Promise.reject(new Error("Test cases not supported yet"));
  }

  async removeTestCase(): Promise<string> {
    return Promise.reject(new Error("Test cases not supported yet"));
  }

  async deleteSnippet(): Promise<string> {
    return Promise.reject(new Error("Delete snippet not supported yet"));
  }

  async testSnippet(): Promise<TestCaseResult> {
    return Promise.reject(new Error("Test snippet not supported yet"));
  }

  async getFileTypes(): Promise<FileType[]> {
    return [];
  }

  async modifyFormatRule(): Promise<Rule[]> {
    return [];
  }

  async modifyLintingRule(): Promise<Rule[]> {
    return [];
  }
}
