export interface SnippetUploadDTO {
  name: string;
  language: string;
  version: string;
  description: string;
  versionTag?: string;
}

export interface SubmitSnippetDTO {
  code: string;
  name: string;
  language: string;
  langVersion: string;
  description: string;
  versionTag?: string;
}

export interface SnippetFilterDTO {
  page?: number;
  size?: number;
  name?: string;
  language?: string;
  conformance?: string;
  mode?: string;
  sort?: string;
  dir?: string;
}

export interface SnippetResponseDTO {
  id: string;
  name: string;
  language: string;
  description: string;
  ownerId: string;
  version: string;
  conformance?: string;
  createdAt: string;
}

export interface UserResponseDTO {
  id: string;
  email: string;
}

export interface LanguageConfig {
  name: string;
  version: string[];
  extension: string;
}

export interface OwnerConfigDto {
    [key: string]: any;
}
