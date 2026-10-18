import type {
  ClinicOwnerProfileResponse,
  ClinicOwnersBoardResponse,
  ClinicPetsBoardResponse,
} from '@petspond/types';
import type { ApiClient } from '@petspond/api-client';

const PREFIX = '/vet/directory';

export const directoryApi = {
  listPets(client: ApiClient) {
    return client.get<ClinicPetsBoardResponse>(`${PREFIX}/pets`);
  },

  listOwners(client: ApiClient) {
    return client.get<ClinicOwnersBoardResponse>(`${PREFIX}/owners`);
  },

  getOwner(client: ApiClient, ownerId: string) {
    return client.get<ClinicOwnerProfileResponse>(
      `${PREFIX}/owners/${encodeURIComponent(ownerId)}`,
    );
  },
};
