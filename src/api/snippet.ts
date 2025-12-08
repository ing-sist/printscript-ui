import { AxiosInstance } from 'axios';
import { 
  SnippetFilterDTO, 
  SnippetResponseDTO, 
  SnippetUploadDTO, 
  SubmitSnippetDTO 
} from './types';

// US #1: Upload from file
export const uploadSnippetFromFile = async (client: AxiosInstance, file: File, params: SnippetUploadDTO) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
        }
    });
    
    const response = await client.post(`/snippets/upload-from-file?${queryParams.toString()}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
}

// US #3: Upload inline (Editor)
export const uploadSnippetInline = async (client: AxiosInstance, code: string, params: SnippetUploadDTO) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
        }
    });

    const response = await client.post(`/snippets/upload-inline?${queryParams.toString()}`, code, {
        headers: {
            'Content-Type': 'text/plain' 
        }
    });
    return response.data;
}

// US #2 & #4: Update snippet
export const updateSnippet = async (client: AxiosInstance, id: string, snippet: SubmitSnippetDTO) => {
    const response = await client.put(`/snippets/${id}`, snippet);
    return response.data;
}

// US #5: List all
export const getAllSnippets = async (client: AxiosInstance, filter?: SnippetFilterDTO) => {
    const queryParams = new URLSearchParams();
    if (filter) {
        if (filter.page !== undefined) queryParams.append('page', filter.page.toString());
        if (filter.size !== undefined) queryParams.append('size', filter.size.toString());
        if (filter.name) queryParams.append('name', filter.name);
        if (filter.language) queryParams.append('language', filter.language);
        if (filter.conformance) queryParams.append('conformance', filter.conformance);
        if (filter.mode) queryParams.append('mode', filter.mode);
        if (filter.sort) queryParams.append('sort', filter.sort);
        if (filter.dir) queryParams.append('dir', filter.dir);
    }
    const response = await client.get<SnippetResponseDTO[]>(`/snippets?${queryParams.toString()}`);
    return response.data;
}

// US #6: Get Metadata
export const getSnippetMetadata = async (client: AxiosInstance, id: string) => {
    const response = await client.get<SnippetResponseDTO>(`/snippets/${id}/metadata`);
    return response.data;
}

// US #13: Download / Get Content
export const getSnippetContent = async (client: AxiosInstance, id: string) => {
    const response = await client.get(`/snippets/${id}/download`, {
        responseType: 'text'
    });
    return response.data as string;
}

export const downloadSnippetBlob = async (client: AxiosInstance, id: string) => {
    const response = await client.get(`/snippets/${id}/download`, {
        responseType: 'blob'
    });
    return response.data as Blob;
}

// US #7: Share
export const shareSnippet = async (client: AxiosInstance, id: string, targetUserId: string) => {
    const response = await client.post(`/snippets/${id}/share`, targetUserId, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.data;
}

export const formatSnippet = async (client: AxiosInstance, id: string) => {
    const response = await client.post(`/snippets/format/${id}`);
    return response.data;
}

export const lintSnippet = async (client: AxiosInstance, id: string) => {
    const response = await client.post(`/snippets/lint/${id}`);
    return response.data;
}

export const deleteSnippet = async (client: AxiosInstance, id: string) => {
    await client.delete(`/snippets/${id}`);
}
