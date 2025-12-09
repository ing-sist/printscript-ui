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
import * as testApi from "../../api/tests";
import * as rulesApi from "../../api/rules";
import { SnippetUploadDTO, SubmitSnippetDTO, SnippetFilterDTO, SnippetTestResponseDTO, FormattingRulesDTO, LintingRulesDTO } from "../../api/types";

type GetToken = () => Promise<string>;

export class ApiSnippetOperations implements SnippetOperations {
  private readonly client: AxiosInstance;
  private readonly getToken: GetToken;

  constructor(getAccessTokenSilently: GetToken) {
    this.getToken = getAccessTokenSilently;
    this.client = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8080/snippet",
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

  async listSnippetDescriptors(page: number, pageSize: number, snippetName?: string, filters?: SnippetFilterDTO): Promise<PaginatedSnippets> {
    const snippetsPage = await snippetApi.getAllSnippets(this.client, {
      page,
      size: pageSize,
      name: snippetName,
      ...filters
    });
    
    return {
      page: snippetsPage.number ?? page,
      page_size: snippetsPage.size ?? pageSize,
      count: snippetsPage.totalElements ?? 0,
      snippets: snippetsPage.content.map(s => ({
        id: s.id,
        name: s.name,
        content: "", // List doesn't return content
        language: s.language,
        extension: "txt", // Should infer from language
        compliance: this.mapConformanceToCompliance(s.conformance),
        author: s.ownerId,
        description: s.description,
        version: s.version
      }))
    };
  }

  async createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {
    const dto: SnippetUploadDTO = {
      name: createSnippet.name,
      language: createSnippet.language,
      version: createSnippet.version,
      description: createSnippet.description,
    };

    const response = await snippetApi.uploadSnippetInline(this.client, createSnippet.content, dto);
    
    return {
      id: response.snippetId || response.id || "temp-id",
      name: createSnippet.name,
      content: createSnippet.content,
      language: createSnippet.language,
      extension: createSnippet.extension,
      compliance: "pending",
      author: "Me",
      description: createSnippet.description,
      version: createSnippet.version
    };
  }

  async getSnippetById(id: string): Promise<Snippet | undefined> {
    try {
        const metadata = await snippetApi.getSnippetMetadata(this.client, id);

        return {
          id: metadata.id,
          name: metadata.name,
          content: metadata.content,
          language: metadata.language,
          extension: "txt",
          compliance: this.mapConformanceToCompliance(metadata.conformance),
          author: metadata.ownerId,
          description: metadata.description,
          version: metadata.version
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
      langVersion: "1.1",
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
      language: l.language,
      extension: l.extension
    }));
  }

  async getFormatRules(): Promise<Rule[]> { 
    const dto = await rulesApi.getFormattingRules(this.client);
    return this.mapFormattingRules(dto);
  }
  async getLintingRules(): Promise<Rule[]> { 
    const dto = await rulesApi.getLintingRules(this.client);
    return this.mapLintingRules(dto);
  }
  async getTestCases(snippetId: string): Promise<TestCase[]> {
    const tests = await testApi.listTests(this.client, snippetId);
    return tests.map(this.mapTestFromDto);
  }
  
  async formatSnippet(id: string): Promise<string> { 
    await snippetApi.formatSnippet(this.client, id);
    const maxAttempts = 6;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    let content = "";
    for (let i = 0; i < maxAttempts; i++) {
      try {
        content = await snippetApi.getSnippetContent(this.client, id);
        if (content) break;
      } catch (e) {
        // keep retrying
      }
      await delay(700);
    }
    return content;
  }

  async lintSnippet(id: string): Promise<string> {
    await snippetApi.lintSnippet(this.client, id);
    return "Lint request submitted";
  }

  async downloadSnippet(id: string): Promise<Blob> {
    return await snippetApi.downloadSnippetBlob(this.client, id);
  }

  async postTestCase(snippetId: string, testCase: Partial<TestCase>): Promise<TestCase> {
    const dto: SnippetTestResponseDTO = await testApi.createTest(this.client, snippetId, {
      name: testCase.name || "Unnamed test",
      inputs: testCase.input ?? [],
      expectedOutputs: testCase.output ?? [],
    });
    return this.mapTestFromDto(dto);
  }

  async removeTestCase(snippetId: string, testId: string): Promise<string> {
    await testApi.deleteTest(this.client, snippetId, testId);
    return testId;
  }

  async testSnippet(snippetId: string, testId: string): Promise<TestCaseResult> {
      const result = await testApi.runTest(this.client, snippetId, testId);
      return result.status === "SUCCESS" ? "success" : "fail";
  }
  async modifyFormatRule(newRules: Rule[]): Promise<Rule[]> { 
    const dto = this.rulesToFormattingDto(newRules);
    await rulesApi.updateFormattingRules(this.client, dto);
    return this.mapFormattingRules(dto);
  }
  async modifyLintingRule(newRules: Rule[]): Promise<Rule[]> { 
    const dto = this.rulesToLintingDto(newRules);
    await rulesApi.updateLintingRules(this.client, dto);
    return this.mapLintingRules(dto);
  }

  private mapTestFromDto(dto: SnippetTestResponseDTO): TestCase {
    return {
      id: dto.id,
      name: dto.name,
      input: dto.inputs,
      output: dto.expectedOutputs,
    };
  }

  private mapConformanceToCompliance(conformance?: string | null): ComplianceEnum {
    const normalized = conformance?.toUpperCase();
    switch (normalized) {
      case "COMPLIANT":
        return "compliant";
      case "NOT_COMPLIANT":
      case "NON_COMPLIANT":
        return "non-compliant";
      case "FAILED":
      case "EXTERNAL_ERROR":
        return "failed";
      case "PENDING":
      default:
        return "pending";
    }
  }

  private mapFormattingRules(dto: FormattingRulesDTO): Rule[] {
    return [
      { id: "Indentation", name: "Indentation", isActive: true, value: dto.Indentation },
      { id: "SpaceBeforeColon", name: "SpaceBeforeColon", isActive: dto.SpaceBeforeColon, value: null },
      { id: "SpaceAfterColon", name: "SpaceAfterColon", isActive: dto.SpaceAfterColon, value: null },
      { id: "SpaceAroundAssignment", name: "SpaceAroundAssignment", isActive: dto.SpaceAroundAssignment, value: null },
      { id: "SpaceAroundOperators", name: "SpaceAroundOperators", isActive: dto.SpaceAroundOperators, value: null },
      { id: "MaxSpaceBetweenTokens", name: "MaxSpaceBetweenTokens", isActive: dto.MaxSpaceBetweenTokens, value: null },
      { id: "LineBreakBeforePrintln", name: "LineBreakBeforePrintln", isActive: true, value: dto.LineBreakBeforePrintln },
      { id: "LineBreakAfterSemiColon", name: "LineBreakAfterSemiColon", isActive: dto.LineBreakAfterSemiColon, value: null },
      { id: "InlineBraceIfStatement", name: "InlineBraceIfStatement", isActive: dto.InlineBraceIfStatement, value: null },
      { id: "BelowLineBraceIfStatement", name: "BelowLineBraceIfStatement", isActive: dto.BelowLineBraceIfStatement, value: null },
      { id: "BraceLineBreak", name: "BraceLineBreak", isActive: true, value: dto.BraceLineBreak },
      { id: "KeywordSpacingAfter", name: "KeywordSpacingAfter", isActive: dto.KeywordSpacingAfter, value: null },
    ];
  }

  private mapLintingRules(dto: LintingRulesDTO): Rule[] {
    return [
      { id: "printlnSimpleArg", name: "printlnSimpleArg", isActive: dto.printlnSimpleArg, value: null },
      { id: "readInputSimpleArg", name: "readInputSimpleArg", isActive: dto.readInputSimpleArg, value: null },
      { id: "identifierNamingType", name: "identifierNamingType", isActive: true, value: dto.identifierNamingType },
    ];
  }

  private rulesToFormattingDto(rules: Rule[]): FormattingRulesDTO {
    const get = (name: string) => rules.find(r => r.name === name);
    return {
      Indentation: Number(get("Indentation")?.value ?? 0),
      SpaceBeforeColon: !!get("SpaceBeforeColon")?.isActive,
      SpaceAfterColon: !!get("SpaceAfterColon")?.isActive,
      SpaceAroundAssignment: !!get("SpaceAroundAssignment")?.isActive,
      SpaceAroundOperators: !!get("SpaceAroundOperators")?.isActive,
      MaxSpaceBetweenTokens: !!get("MaxSpaceBetweenTokens")?.isActive,
      LineBreakBeforePrintln: Number(get("LineBreakBeforePrintln")?.value ?? 0),
      LineBreakAfterSemiColon: !!get("LineBreakAfterSemiColon")?.isActive,
      InlineBraceIfStatement: !!get("InlineBraceIfStatement")?.isActive,
      BelowLineBraceIfStatement: !!get("BelowLineBraceIfStatement")?.isActive,
      BraceLineBreak: Number(get("BraceLineBreak")?.value ?? 0),
      KeywordSpacingAfter: !!get("KeywordSpacingAfter")?.isActive,
    };
  }

  private rulesToLintingDto(rules: Rule[]): LintingRulesDTO {
    const get = (name: string) => rules.find(r => r.name === name);
    return {
      printlnSimpleArg: !!get("printlnSimpleArg")?.isActive,
      readInputSimpleArg: !!get("readInputSimpleArg")?.isActive,
      identifierNamingType: (get("identifierNamingType")?.value as string) || "camel",
    };
  }
}
