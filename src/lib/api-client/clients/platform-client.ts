import type { ApiClient } from '../api-client';

export class PlatformClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'platform') {}

  updateBetaMode(enabled: boolean) {
    return this.apiClient.putJson<{ betaMode: boolean; beta_mode: boolean }>(`${this.baseEndpoint}/beta-mode`, {
      enabled,
    });
  }
}
