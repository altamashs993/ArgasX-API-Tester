import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { ApiResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface ResponseViewerProps {
  response: ApiResponse;
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState("pretty");
  const [viewFormat, setViewFormat] = useState<'text' | 'json' | 'xml' | 'html' | 'javascript'>('json');
  const { toast } = useToast();

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-status-success';
    if (status >= 400 && status < 500) return 'bg-status-client-error';
    if (status >= 500) return 'bg-status-server-error';
    return 'bg-muted';
  };

  const getLanguageExtension = () => {
    switch (viewFormat) {
      case 'json': return [json()];
      case 'xml': return [xml()];
      case 'html': return [html()];
      case 'javascript': return [javascript()];
      default: return [];
    }
  };

  const getFormattedData = () => {
    try {
      if (viewFormat === 'json') {
        const parsed = JSON.parse(response.data);
        return JSON.stringify(parsed, null, 2);
      }
      return response.data;
    } catch {
      return response.data;
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(response.data);
    toast({
      title: "Response copied to clipboard",
      description: "The response body has been copied to your clipboard."
    });
  };

  const downloadResponse = () => {
    const blob = new Blob([response.data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Response downloaded",
      description: "The response has been saved to your downloads folder."
    });
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-4">
      {/* Response Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Badge className={`${getStatusColor(response.status)} text-white`}>
            {response.status} {response.statusText}
          </Badge>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Time: {formatTime(response.time)}</span>
            <span>Size: {formatSize(response.size)}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyResponse}
            className="h-8"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadResponse}
            className="h-8"
          >
            <Download className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Response Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pretty">Pretty</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pretty" className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Format:</span>
            <Select value={viewFormat} onValueChange={(value: any) => setViewFormat(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <CodeMirror
              value={getFormattedData()}
              height="300px"
              theme={oneDark}
              extensions={getLanguageExtension()}
              editable={false}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false
              }}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="raw" className="space-y-2">
          <div className="border rounded-lg overflow-hidden">
            <CodeMirror
              value={response.data}
              height="400px"
              theme={oneDark}
              editable={false}
              basicSetup={{
                lineNumbers: true,
                foldGutter: false,
                dropCursor: false,
                allowMultipleSelections: false,
                highlightSelectionMatches: false,
              }}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="headers" className="space-y-2">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-3 p-2 bg-muted rounded-md">
                <span className="font-medium text-sm w-1/3">{key}</span>
                <span className="text-sm text-muted-foreground flex-1">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}