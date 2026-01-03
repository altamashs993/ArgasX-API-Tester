import { ApiRequest, ApiResponse, Header } from "@/types";
import { FormField } from "@/components/FormDataEditor";

export class HttpService {
  // Ensure URL has proper protocol
  static normalizeUrl(url: string): string {
    let normalizedUrl = url.trim();
    
    // Add http:// if no protocol specified
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = 'http://' + normalizedUrl;
    }
    
    return normalizedUrl;
  }

  static async sendRequest(request: ApiRequest): Promise<ApiResponse> {
    const startTime = Date.now();
    
    try {
      // Normalize URL to ensure it has proper protocol
      const url = this.normalizeUrl(request.url);
      
      // Prepare headers
      const headers: Record<string, string> = {};
      request.headers
        .filter(header => header.enabled && header.key && header.value)
        .forEach(header => {
          headers[header.key] = header.value;
        });

      // Prepare request options
      const requestOptions: RequestInit = {
        method: request.method,
        headers,
        mode: 'cors',
      };

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase())) {
        if (request.bodyType === 'form-data' && request.formData) {
          const formData = new FormData();
          request.formData
            .filter(field => field.enabled && field.key)
            .forEach(field => {
              if (field.type === 'file' && field.file) {
                formData.append(field.key, field.file);
              } else if (field.type === 'text' && field.value) {
                formData.append(field.key, field.value);
              }
            });
          requestOptions.body = formData;
        } else if (request.bodyType === 'raw' && request.body) {
          requestOptions.body = request.body;
        }
      }

      // Make the request
      const response = await fetch(url, requestOptions);
      
      const endTime = Date.now();
      const responseText = await response.text();
      
      // Get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseText,
        time: endTime - startTime,
        size: new Blob([responseText]).size
      };
    } catch (error) {
      const endTime = Date.now();
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Provide more helpful error messages for common issues
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = `Network Error: Unable to reach the server. This could be due to:
1. CORS: The target server doesn't allow requests from this origin. Configure the server to send 'Access-Control-Allow-Origin: *' header.
2. Mixed Content: You're on HTTPS but requesting HTTP. Try using a local/same-network device.
3. Server Unreachable: The server may be down or the URL is incorrect.
4. Firewall: Network firewall may be blocking the request.

Tip: For local network devices, ensure they support CORS or use a CORS proxy.`;
      }
      
      return {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: JSON.stringify({ error: errorMessage }, null, 2),
        time: endTime - startTime,
        size: 0
      };
    }
  }
}

export class StorageService {
  private static STORAGE_KEY = 'lightpostman_requests';

  static saveRequests(requests: ApiRequest[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
    } catch (error) {
      console.error('Failed to save requests:', error);
    }
  }

  static loadRequests(): ApiRequest[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
    return [];
  }

  static exportRequests(requests: ApiRequest[]): void {
    const dataStr = JSON.stringify({
      lightpostman_collection: {
        info: {
          name: "LightPostman Collection",
          description: "Exported from LightPostman",
          version: "1.0.0",
          exportedAt: new Date().toISOString()
        },
        requests: requests
      }
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `lightpostman-collection-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  static async importRequests(): Promise<ApiRequest[] | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          
          // Handle LightPostman format
          if (data.lightpostman_collection?.requests) {
            resolve(data.lightpostman_collection.requests);
            return;
          }
          
          // Handle direct array format
          if (Array.isArray(data)) {
            resolve(data);
            return;
          }
          
          // Handle Postman format (basic conversion)
          if (data.collection?.item) {
            const converted = this.convertPostmanCollection(data.collection.item);
            resolve(converted);
            return;
          }
          
          resolve(null);
        } catch (error) {
          console.error('Failed to parse import file:', error);
          resolve(null);
        }
      };
      
      input.click();
    });
  }

  private static convertPostmanCollection(items: any[]): ApiRequest[] {
    const requests: ApiRequest[] = [];
    
    const processItem = (item: any) => {
      if (item.request) {
        const request: ApiRequest = {
          id: crypto.randomUUID(),
          name: item.name || 'Imported Request',
          method: item.request.method || 'GET',
          url: typeof item.request.url === 'string' ? item.request.url : item.request.url?.raw || '',
          headers: [],
          body: '',
          bodyType: 'raw',
          rawFormat: 'text',
          formData: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Convert headers
        if (item.request.header) {
          request.headers = item.request.header.map((h: any) => ({
            key: h.key,
            value: h.value,
            enabled: !h.disabled
          }));
        }
        
        // Convert body
        if (item.request.body) {
          if (item.request.body.raw) {
            request.body = item.request.body.raw;
            request.bodyType = 'raw';
            if (item.request.body.options?.raw?.language === 'json') {
              request.rawFormat = 'json';
            } else if (item.request.body.options?.raw?.language === 'xml') {
              request.rawFormat = 'xml';
            } else {
              request.rawFormat = 'text';
            }
          }
        }
        
        requests.push(request);
      }
      
      // Process nested items
      if (item.item) {
        item.item.forEach(processItem);
      }
    };
    
    items.forEach(processItem);
    return requests;
  }
}