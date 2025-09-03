export interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

export interface FormField {
  key: string;
  value: string;
  type: 'text' | 'file';
  enabled: boolean;
  file?: File;
}

export interface ApiRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Header[];
  body: string;
  bodyType: 'form-data' | 'raw';
  rawFormat?: 'text' | 'json' | 'xml' | 'html' | 'javascript';
  formData?: FormField[];
  collectionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  time: number;
  size: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  httpVersion: 'HTTP/1.x' | 'HTTP/2';
  maxResponseSize: number; // in MB
  theme: 'light' | 'dark' | 'system';
}

export interface RequestHistory {
  id: string;
  requestId: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
}