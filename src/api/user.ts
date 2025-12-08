import { AxiosInstance } from 'axios';
import { UserResponseDTO } from './types';

export const searchUsers = async (client: AxiosInstance, email: string) => {
    const response = await client.get<UserResponseDTO[]>(`/users`, {
        params: { email }
    });
    return response.data;
}
