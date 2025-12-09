import { AxiosInstance } from 'axios';
import { LanguageConfig } from './types';

export const getSupportedLanguages = async (client: AxiosInstance) => {
    const response = await client.get<LanguageConfig[]>('/languages');
    return response.data;
}
