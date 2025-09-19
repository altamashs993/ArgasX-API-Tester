import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, X, Save, Copy, ChevronDown } from "lucide-react";
import { RequestEditor } from "./RequestEditor";
import { ResponseViewer } from "./ResponseViewer";
import { HeadersEditor } from "./HeadersEditor";
import { SaveRequestDialog } from "./SaveRequestDialog";
import { useToast } from "@/hooks/use-toast";
import { ApiRequest, ApiResponse, Collection } from "@/types";


interface RequestTabProps {
  request: ApiRequest;
  response?: ApiResponse;
  isLoading: boolean;
  collections: Collection[];
  hasChanges: boolean;
  onRequestChange: (request: ApiRequest) => void;
  onSendRequest: () => void;
  onCloseTab: () => void;
  onSaveRequest: (name: string, collectionId: string) => void;
  onUpdateRequest: () => void;
  onSaveAsNew: (name: string, collectionId: string) => void;
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
  collections,
  hasChanges,
  onRequestChange,
  onSendRequest,
  onCloseTab,
  onSaveRequest,
  onUpdateRequest,
  onSaveAsNew
}: RequestTabProps) {
  const { toast } = useToast();
  const [showSaveDialog, setShowSaveDialog] = useState(false);

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
    <div className="h-full flex flex-col space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Input
            value={request.name}
            onChange={(e) => updateRequest({ name: e.target.value })}
            className="h-8 text-sm font-medium bg-transparent border-none shadow-none p-1 max-w-xs min-w-0"
            placeholder="Request name"
          />
          {response && (
            <Badge className={`${getStatusColor(response.status)} text-white text-xs flex-shrink-0`}>
              {response.status} {response.statusText}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
          {hasChanges && request.collectionId ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  title="Save options"
                >
                  <Save className="h-4 w-4 mr-1" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onUpdateRequest}>
                  Update Request
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
                  Save as New
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              className="h-8 w-8 p-0"
              title="Save request"
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
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
      <Card className="p-3 lg:p-4">
        <div className="space-y-3 lg:space-y-4">
          {/* Method and URL */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Select
              value={request.method}
              onValueChange={(method) => updateRequest({ method })}
            >
              <SelectTrigger className="w-full sm:w-32">
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
            <div className="flex-1 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                placeholder="Enter request URL"
                value={request.url}
                onChange={(e) => updateRequest({ url: e.target.value })}
                className="flex-1 min-w-0"
              />
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyUrl}
                  className="h-10 w-10 p-0 flex-shrink-0"
                  title="Copy URL"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={onSendRequest}
                  disabled={isLoading || !request.url}
                  className="px-4 lg:px-6 flex-shrink-0"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </div>

          {/* Request Configuration */}
          <Tabs defaultValue="headers" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9 lg:h-10">
              <TabsTrigger value="headers" className="text-xs lg:text-sm">Headers</TabsTrigger>
              <TabsTrigger value="body" className="text-xs lg:text-sm">Body</TabsTrigger>
              <TabsTrigger value="params" className="text-xs lg:text-sm">Params</TabsTrigger>
            </TabsList>
            <TabsContent value="headers" className="space-y-2 mt-3 lg:mt-4">
              <HeadersEditor
                headers={request.headers}
                onChange={(headers) => updateRequest({ headers })}
              />
            </TabsContent>
            <TabsContent value="body" className="space-y-2 mt-3 lg:mt-4">
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
            <TabsContent value="params" className="space-y-2 mt-3 lg:mt-4">
              <div className="text-xs lg:text-sm text-muted-foreground p-4 text-center">
                URL parameters coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Response */}
      {response && (
        <Card className="flex-1 p-3 lg:p-4 min-h-0 overflow-hidden">
          <ResponseViewer response={response} />
        </Card>
      )}

      {/* Save Dialog */}
      <SaveRequestDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        request={request}
        collections={collections}
        onSaveRequest={(name, collectionId) => {
          if (hasChanges && request.collectionId) {
            onSaveAsNew(name, collectionId);
          } else {
            onSaveRequest(name, collectionId);
          }
          setShowSaveDialog(false);
        }}
        onCreateCollection={() => {
          // This would need to be handled by the parent
          // For now, we'll just close the dialog
          setShowSaveDialog(false);
        }}
      />
    </div>
  );
}