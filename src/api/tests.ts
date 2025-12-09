import { AxiosInstance } from "axios";
import { SnippetTestResponseDTO, CreateTestRequestDTO, RunTestResponseDTO } from "./types";

export const listTests = async (client: AxiosInstance, snippetId: string) => {
  const response = await client.get<SnippetTestResponseDTO[]>(`/snippets/${snippetId}/tests`);
  return response.data;
};

export const createTest = async (client: AxiosInstance, snippetId: string, request: CreateTestRequestDTO) => {
  const response = await client.post<SnippetTestResponseDTO>(`/snippets/${snippetId}/tests`, request);
  return response.data;
};

export const deleteTest = async (client: AxiosInstance, snippetId: string, testId: string) => {
  await client.delete(`/snippets/${snippetId}/tests/${testId}`);
};

export const runTest = async (client: AxiosInstance, snippetId: string, testId: string) => {
  const response = await client.post<RunTestResponseDTO>(`/snippets/${snippetId}/tests/${testId}/run`);
  return response.data;
};
