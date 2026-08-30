import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Play, Save, ChevronDown, Loader2 } from "lucide-react";
import { RequestEditor } from "./RequestEditor";
import { ResponseViewer } from "./ResponseViewer";
import { HeadersEditor } from "./HeadersEditor";
import { SaveRequestDialog } from "./SaveRequestDialog";
import { ScriptEditor } from "./ScriptEditor";
import { TestResultsPanel } from "./TestResultsPanel";
import { QueryParamsEditor } from "./QueryParamsEditor";
import { useToast } from "@/hooks/use-toast";
import { ApiRequest, ApiResponse, Collection, TestResult } from "@/types";
import { cn } from "@/lib/utils";

interface RequestTabProps {
  request: ApiRequest;
  response?: ApiResponse;
  testResults?: TestResult[];
  scriptLogs?: string[];
  scriptError?: string;
  isLoading: boolean;
  collections: Collection[];
  hasChanges: boolean;
  onRequestChange: (request: ApiRequest) => void;
  onSendRequest: () => void;
  onCloseTab: () => void;
  onSaveRequest: (name: string, collectionId: string) => void;
  onUpdateRequest: () => void;
  onSaveAsNew: (name: string, collectionId: string) => void;
  onCreateCollection: (collection: Omit<Collection, "id" | "createdAt" | "updatedAt">) => Collection;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

function getMethodClass(method: string) {
  const m = method.toUpperCase();
  if (m === 'GET') return 'method-get';
  if (m === 'POST') return 'method-post';
  if (m === 'PUT') return 'method-put';
  if (m === 'DELETE') return 'method-delete';
  if (m === 'PATCH') return 'method-patch';
  if (m === 'HEAD') return 'method-head';
  if (m === 'OPTIONS') return 'method-options';
  return 'text-muted-foreground';
}

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return 'bg-green-600';
  if (status >= 400 && status < 500) return 'bg-yellow-600';
  if (status >= 500) return 'bg-red-600';
  return 'bg-zinc-600';
}

export function RequestTab({
  request, response, testResults, scriptLogs, scriptError,
  isLoading, collections, hasChanges,
  onRequestChange, onSendRequest, onCloseTab,
  onSaveRequest, onUpdateRequest, onSaveAsNew, onCreateCollection
}: RequestTabProps) {
  const { toast } = useToast();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeSection, setActiveSection] = useState<'params' | 'headers' | 'body' | 'scripts' | 'tests'>('headers');

  const updateRequest = (updates: Partial<ApiRequest>) => {
    onRequestChange({ ...request, ...updates });
  };

  const hasTestResults = (testResults?.length ?? 0) > 0 || (scriptLogs?.length ?? 0) > 0 || scriptError;

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* URL Bar */}
      <div className="glass-card rounded-lg p-3 flex items-center gap-2">
        {/* Method selector */}
        <Select value={request.method} onValueChange={(method) => updateRequest({ method })}>
          <SelectTrigger className={cn("w-28 h-9 text-sm font-bold border-zinc-700 bg-zinc-900", getMethodClass(request.method))}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {HTTP_METHODS.map((m) => (
              <SelectItem key={m} value={m} className={cn("text-sm font-bold", getMethodClass(m))}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* URL input */}
        <Input
          placeholder="Enter URL or paste text"
          value={request.url}
          onChange={(e) => updateRequest({ url: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && request.url && onSendRequest()}
          className="flex-1 h-9 font-mono text-sm bg-zinc-900 border-zinc-700 focus:border-primary/50"
        />

        {/* Send button */}
        <Button
          onClick={onSendRequest}
          disabled={isLoading || !request.url}
          className="btn-send h-9 px-5 flex-shrink-0"
        >
          {isLoading
            ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Sending</>
            : <><Play className="h-3.5 w-3.5 mr-2" />Send</>
          }
        </Button>

        {/* Save */}
        {hasChanges && request.collectionId ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 px-2 border border-zinc-700">
                <Save className="h-3.5 w-3.5 mr-1" /><ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700">
              <DropdownMenuItem onClick={onUpdateRequest}>Update Request</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>Save as New</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(true)} className="h-9 w-9 p-0 border border-zinc-700">
            <Save className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Request config tabs */}
      <div className="glass-card rounded-lg overflow-hidden flex-shrink-0">
        <div className="flex items-center border-b border-white/5">
          {(['params', 'headers', 'body', 'scripts', 'tests'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab)}
              className={cn(
                "px-4 py-2.5 text-xs font-medium capitalize transition-colors relative",
                activeSection === tab
                  ? "text-foreground tab-active-indicator"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
              {tab === 'tests' && hasTestResults && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
          {response && (
            <div className="ml-auto flex items-center gap-2 pr-3">
              <Badge className={cn(getStatusColor(response.status), "text-white text-xs")}>
                {response.status} {response.statusText}
              </Badge>
              <span className="text-xs text-muted-foreground">{response.time}ms</span>
              <span className="text-xs text-muted-foreground">
                {response.size < 1024 ? `${response.size}B` : `${(response.size / 1024).toFixed(1)}KB`}
              </span>
            </div>
          )}
        </div>
        <div className="p-3">
          {activeSection === 'params' && (
            <QueryParamsEditor
              params={request.queryParams ?? []}
              onChange={(queryParams) => updateRequest({ queryParams })}
            />
          )}
          {activeSection === 'headers' && (
            <HeadersEditor headers={request.headers} onChange={(headers) => updateRequest({ headers })} />
          )}
          {activeSection === 'body' && (
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
          )}
          {activeSection === 'scripts' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Pre-request Script</p>
                <ScriptEditor
                  type="pre-request"
                  value={request.preRequestScript ?? ''}
                  onChange={(v) => updateRequest({ preRequestScript: v })}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Tests Script</p>
                <ScriptEditor
                  type="test"
                  value={request.testScript ?? ''}
                  onChange={(v) => updateRequest({ testScript: v })}
                />
              </div>
            </div>
          )}
          {activeSection === 'tests' && (
            <TestResultsPanel
              testResults={testResults ?? []}
              logs={scriptLogs ?? []}
              scriptError={scriptError}
            />
          )}
        </div>
      </div>

      {/* Response */}
      {response && (
        <div className="glass-card rounded-lg flex-1 min-h-0 overflow-hidden">
          <ResponseViewer response={response} />
        </div>
      )}

      <SaveRequestDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        request={request}
        collections={collections}
        onSaveRequest={(name, collectionId) => {
          hasChanges && request.collectionId ? onSaveAsNew(name, collectionId) : onSaveRequest(name, collectionId);
          setShowSaveDialog(false);
        }}
        onCreateCollection={onCreateCollection}
      />
    </div>
  );
}
