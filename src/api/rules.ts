import { AxiosInstance } from "axios";
import { FormattingRulesDTO, LintingRulesDTO } from "./types";

export const getFormattingRules = async (client: AxiosInstance) => {
  const response = await client.get<FormattingRulesDTO>("/rules/formatting");
  return response.data;
};

export const updateFormattingRules = async (client: AxiosInstance, rules: FormattingRulesDTO) => {
  await client.put("/rules/formatting", rules);
};

export const getLintingRules = async (client: AxiosInstance) => {
  const response = await client.get<LintingRulesDTO>("/rules/linting");
  return response.data;
};

export const updateLintingRules = async (client: AxiosInstance, rules: LintingRulesDTO) => {
  await client.put("/rules/linting", rules);
};
