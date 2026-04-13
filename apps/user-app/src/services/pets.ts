import type { ApiClient } from '@petspond/api-client';
import type { CreatePetDto, Pet } from '@petspond/types';

export function fetchUserPets(client: ApiClient) {
  return client.get<Pet[]>('/user/pets');
}

export function createPet(client: ApiClient, body: CreatePetDto) {
  return client.post<Pet>('/user/pets', body);
}
