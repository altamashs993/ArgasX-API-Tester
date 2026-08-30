import { ApiRequest, Collection, Settings, RequestHistory } from '@/types';

const STORAGE_KEYS = {
  COLLECTIONS: 'argasx-collections',
  REQUESTS: 'argasx-requests',
  SETTINGS: 'argasx-settings',
  HISTORY: 'argasx-history'
};

export class StorageService {
  // Collections
  static getCollections(): Collection[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((c: any) => ({
        ...c,
        id: String(c.id || crypto.randomUUID()),
        name: typeof c.name === 'object' && c.name !== null ? String(c.name.name || 'Unnamed Collection') : String(c.name || 'Unnamed Collection'),
        description: typeof c.description === 'object' && c.description !== null ? String(c.description.description || '') : String(c.description || ''),
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || new Date().toISOString()
      }));
    } catch {
      return [];
    }
  }

  static saveCollections(collections: Collection[]): void {
    const sanitized = collections.map(c => ({
      ...c,
      name: typeof c.name === 'object' && c.name !== null ? String((c.name as any).name || 'Unnamed Collection') : String(c.name || 'Unnamed Collection'),
      description: typeof c.description === 'object' && c.description !== null ? String((c.description as any).description || '') : String(c.description || '')
    }));
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(sanitized));
  }

  static createCollection(collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'> | any): Collection {
    const collections = this.getCollections();
    const nameStr = typeof collection === 'object' && collection !== null && typeof collection.name === 'object' && collection.name !== null
      ? String(collection.name.name || 'New Collection')
      : typeof collection === 'object' && collection !== null && typeof collection.name === 'string'
      ? collection.name
      : String(collection || 'New Collection');

    const descStr = typeof collection === 'object' && collection !== null && typeof collection.description === 'string'
      ? collection.description
      : '';

    const newCollection: Collection = {
      id: crypto.randomUUID(),
      name: nameStr,
      description: descStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    collections.push(newCollection);
    this.saveCollections(collections);
    return newCollection;
  }

  static updateCollection(id: string, updates: Partial<Collection>): void {
    const collections = this.getCollections();
    const index = collections.findIndex(c => c.id === id);
    if (index !== -1) {
      collections[index] = {
        ...collections[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveCollections(collections);
    }
  }

  static deleteCollection(id: string): void {
    const collections = this.getCollections().filter(c => c.id !== id);
    this.saveCollections(collections);
    // Also delete all requests in this collection
    const requests = this.getRequests().filter(r => r.collectionId !== id);
    this.saveRequests(requests);
  }

  // Requests
  static getRequests(): ApiRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveRequests(requests: ApiRequest[]): void {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  }

  static getRequestsByCollection(collectionId: string): ApiRequest[] {
    return this.getRequests().filter(r => r.collectionId === collectionId);
  }

  static saveRequest(request: Omit<ApiRequest, 'id' | 'createdAt' | 'updatedAt'>): ApiRequest {
    const requests = this.getRequests();
    const newRequest: ApiRequest = {
      ...request,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    requests.push(newRequest);
    this.saveRequests(requests);
    return newRequest;
  }

  static updateRequest(id: string, updates: Partial<ApiRequest>): void {
    const requests = this.getRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index !== -1) {
      requests[index] = {
        ...requests[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveRequests(requests);
    }
  }

  static deleteRequest(id: string): void {
    const requests = this.getRequests().filter(r => r.id !== id);
    this.saveRequests(requests);
  }

  // Settings
  static getSettings(): Settings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {
        httpVersion: 'HTTP/1.x',
        maxResponseSize: 50,
        theme: 'dark'
      };
    } catch {
      return {
        httpVersion: 'HTTP/1.x',
        maxResponseSize: 50,
        theme: 'dark'
      };
    }
  }

  static saveSettings(settings: Settings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // History
  static getHistory(): RequestHistory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addToHistory(historyItem: Omit<RequestHistory, 'id' | 'timestamp'>): void {
    const history = this.getHistory();
    const newItem: RequestHistory = {
      ...historyItem,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    history.unshift(newItem);
    // Keep only last 100 history items
    if (history.length > 100) {
      history.splice(100);
    }
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  static clearHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }

  static updateHistoryItem(id: string, updates: Partial<RequestHistory>): void {
    const history = this.getHistory();
    const index = history.findIndex(h => h.id === id);
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    }
  }

  static deleteHistoryItem(id: string): void {
    const history = this.getHistory().filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  // Import/Export
  static exportCollection(collectionId?: string): object {
    if (collectionId) {
      const collection = this.getCollections().find(c => c.id === collectionId);
      const requests = this.getRequestsByCollection(collectionId);
      return {
        info: {
          name: collection?.name || 'Exported Collection',
          description: collection?.description || '',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
        },
        item: requests.map(this.convertRequestToPostman)
      };
    } else {
      // Export all collections
      const collections = this.getCollections();
      return {
        collections: collections.map(collection => ({
          ...collection,
          requests: this.getRequestsByCollection(collection.id)
        }))
      };
    }
  }

  static importPostmanCollection(data: any): { collections: Collection[], requests: ApiRequest[] } {
    const collections: Collection[] = [];
    const requests: ApiRequest[] = [];

    if (data.info && data.item) {
      // Single Postman collection
      const collection = this.createCollection({
        name: data.info.name || 'Imported Collection',
        description: data.info.description || ''
      });
      collections.push(collection);

      data.item.forEach((item: any) => {
        const request = this.convertPostmanRequest(item, collection.id);
        if (request) {
          requests.push(this.saveRequest(request));
        }
      });
    }

    return { collections, requests };
  }

  private static convertRequestToPostman(request: ApiRequest): object {
    return {
      name: request.name,
      request: {
        method: request.method,
        header: request.headers
          .filter(h => h.enabled)
          .map(h => ({ key: h.key, value: h.value })),
        url: {
          raw: request.url,
          host: [request.url]
        },
        body: request.bodyType === 'raw' ? {
          mode: 'raw',
          raw: request.body,
          options: {
            raw: {
              language: request.rawFormat === 'json' ? 'json' : 'text'
            }
          }
        } : request.bodyType === 'form-data' ? {
          mode: 'formdata',
          formdata: request.formData?.map(f => ({
            key: f.key,
            value: f.value,
            type: f.type
          }))
        } : undefined
      }
    };
  }

  private static convertPostmanRequest(item: any, collectionId: string): Omit<ApiRequest, 'id' | 'createdAt' | 'updatedAt'> | null {
    if (!item.request) return null;

    const headers = (item.request.header || []).map((h: any) => ({
      key: h.key,
      value: h.value,
      enabled: !h.disabled
    }));

    let body = '';
    let bodyType: 'form-data' | 'raw' = 'raw';
    let rawFormat: 'text' | 'json' | 'xml' | 'html' | 'javascript' = 'text';
    let formData: any[] = [];

    if (item.request.body) {
      if (item.request.body.mode === 'raw') {
        bodyType = 'raw';
        body = item.request.body.raw || '';
        if (item.request.body.options?.raw?.language === 'json') {
          rawFormat = 'json';
        }
      } else if (item.request.body.mode === 'formdata') {
        bodyType = 'form-data';
        formData = (item.request.body.formdata || []).map((f: any) => ({
          key: f.key,
          value: f.value,
          type: f.type || 'text',
          enabled: !f.disabled
        }));
      }
    }

    return {
      name: item.name,
      method: item.request.method,
      url: typeof item.request.url === 'string' ? item.request.url : item.request.url.raw,
      headers,
      body,
      bodyType,
      rawFormat,
      formData,
      collectionId
    };
  }
}
