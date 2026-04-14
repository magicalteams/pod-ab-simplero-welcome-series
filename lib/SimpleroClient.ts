const SIMPLERO_BASE_URL = 'https://simplero.com/api/v1';
const USER_AGENT = 'simplero-substack-sync (adam@magicalteams.com)';

interface SimpleroContact {
  id: number;
  email: string;
  name: string;
  tag_names: string;
}

interface SimpleroContactsResponse {
  contacts: SimpleroContact[];
  hasMore: boolean;
}

interface SimpleroTag {
  id: number;
  name: string;
}

export class SimpleroClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private get authHeaders(): HeadersInit {
    const credentials = Buffer.from(`${this.apiKey}:`).toString('base64');
    return {
      Authorization: `Basic ${credentials}`,
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/json',
    };
  }

  private async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${SIMPLERO_BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), { headers: this.authHeaders });
    if (!res.ok) {
      throw new Error(`Simplero API error ${res.status} on GET ${path}: ${await res.text()}`);
    }
    return res.json() as Promise<T>;
  }

  async getTags(): Promise<SimpleroTag[]> {
    return this.get<SimpleroTag[]>('/tags.json');
  }

  async getContactsByTagId(
    tagId: number,
    updatedFrom?: string,
    page = 0,
  ): Promise<SimpleroContactsResponse> {
    const params: Record<string, string> = {
      tag_id: String(tagId),
      per_page: '100',
      page: String(page),
    };
    if (updatedFrom) params.updated_from = updatedFrom;

    const contacts = await this.get<SimpleroContact[]>('/customers.json', params);
    return { contacts, hasMore: contacts.length === 100 };
  }

  /** Pages through ALL contacts with the given tag since updatedFrom. */
  async *paginateContactsByTag(
    tagId: number,
    updatedFrom?: string,
  ): AsyncGenerator<SimpleroContact> {
    let page = 0;
    while (true) {
      const { contacts, hasMore } = await this.getContactsByTagId(tagId, updatedFrom, page);
      for (const contact of contacts) yield contact;
      if (!hasMore) break;
      page++;
    }
  }

  async createWebhook(targetUrl: string): Promise<{ id: number }> {
    const res = await fetch(`${SIMPLERO_BASE_URL}/webhooks.json`, {
      method: 'POST',
      headers: this.authHeaders,
      body: JSON.stringify({ target_url: targetUrl }),
    });
    if (!res.ok) {
      throw new Error(`Failed to create webhook: ${await res.text()}`);
    }
    return res.json() as Promise<{ id: number }>;
  }
}
