import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Play, X, Save, Copy } from "lucide-react";
import { RequestEditor } from "./RequestEditor";
import { ResponseViewer } from "./ResponseViewer";
import { HeadersEditor } from "./HeadersEditor";
import { FormField } from "./FormDataEditor";
import { useToast } from "@/hooks/use-toast";

export interface Header {
  key: string;
  value: string;
  enabled: boolean;
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
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  time: number;
  size: number;
}

interface RequestTabProps {
  request: ApiRequest;
  response?: ApiResponse;
  isLoading: boolean;
  onRequestChange: (request: ApiRequest) => void;
  onSendRequest: () => void;
  onCloseTab: () => void;
  onSaveRequest: () => void;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case 'GET': return 'bg-method-get';
    case 'POST': return 'bg-method-post';
    case 'PUT': return 'bg-method-put';
    case 'DELETE': return 'bg-method-delete';
    case 'PATCH': return 'bg-method-patch';
    default: return 'bg-muted';
  }
};

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return 'bg-status-success';
  if (status >= 400 && status < 500) return 'bg-status-client-error';
  if (status >= 500) return 'bg-status-server-error';
  return 'bg-muted';
};

export function RequestTab({
  request,
  response,
  isLoading,
  onRequestChange,
  onSendRequest,
  onCloseTab,
  onSaveRequest
}: RequestTabProps) {
  const { toast } = useToast();

  const updateRequest = (updates: Partial<ApiRequest>) => {
    onRequestChange({ ...request, ...updates });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(request.url);
    toast({
      title: "URL copied to clipboard",
      description: request.url
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <Input
            value={request.name}
            onChange={(e) => updateRequest({ name: e.target.value })}
            className="h-8 text-sm font-medium bg-transparent border-none shadow-none p-1 max-w-xs"
            placeholder="Request name"
          />
          {response && (
            <Badge className={`${getStatusColor(response.status)} text-white`}>
              {response.status} {response.statusText}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSaveRequest}
            className="h-8 w-8 p-0"
            title="Save request"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseTab}
            className="h-8 w-8 p-0"
            title="Close tab"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Request Builder */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Method and URL */}
          <div className="flex space-x-2">
            <Select
              value={request.method}
              onValueChange={(method) => updateRequest({ method })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getMethodColor(method)}`} />
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 flex space-x-2">
              <Input
                placeholder="Enter request URL"
                value={request.url}
                onChange={(e) => updateRequest({ url: e.target.value })}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={copyUrl}
                className="h-10 w-10 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={onSendRequest}
                disabled={isLoading || !request.url}
                className="px-6"
              >
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>

          {/* Request Configuration */}
          <Tabs defaultValue="headers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="params">Params</TabsTrigger>
            </TabsList>
            <TabsContent value="headers" className="space-y-2">
              <HeadersEditor
                headers={request.headers}
                onChange={(headers) => updateRequest({ headers })}
              />
            </TabsContent>
            <TabsContent value="body" className="space-y-2">
              <RequestEditor
                body={request.body}
                bodyType={request.bodyType}
                rawFormat={request.rawFormat}
                formData={request.formData}
                onBodyChange={(body) => updateRequest({ body })}
                onBodyTypeChange={(bodyType) => updateRequest({ bodyType })}
                onRawFormatChange={(rawFormat) => updateRequest({ rawFormat })}
                onFormDataChange={(formData) => updateRequest({ formData })}
              />
            </TabsContent>
            <TabsContent value="params" className="space-y-2">
              <div className="text-sm text-muted-foreground p-4 text-center">
                URL parameters coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Response */}
      {response && (
        <Card className="flex-1 p-4">
          <ResponseViewer response={response} />
        </Card>
      )}
    </div>
  );
}