import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RequestTab } from "./RequestTab";
import { ApiRequest, ApiResponse, Collection, TestResult } from "@/types";

interface RequestTabsProps {
  requests: ApiRequest[];
  responses: Record<string, ApiResponse>;
  testResultsMap: Record<string, { results: TestResult[]; logs: string[]; error?: string }>;
  activeTab: string;
  loadingTabs: Set<string>;
  collections: Collection[];
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: () => void;
  onRequestChange: (request: ApiRequest) => void;
  onSendRequest: (requestId: string) => void;
  onSaveRequest: (requestId: string, name: string, collectionId: string) => void;
  onUpdateRequest: (requestId: string) => void;
  onSaveAsNew: (requestId: string, name: string, collectionId: string) => void;
  onCreateCollection: (collection: Omit<Collection, "id" | "createdAt" | "updatedAt">) => Collection;
  onOpenSidebar: () => void;
}

function getMethodClass(method: string) {
  const m = method.toUpperCase();
  if (m === "GET") return "method-get";
  if (m === "POST") return "method-post";
  if (m === "PUT") return "method-put";
  if (m === "DELETE") return "method-delete";
  if (m === "PATCH") return "method-patch";
  return "text-muted-foreground";
}

export function RequestTabs({
  requests, responses, testResultsMap, activeTab, loadingTabs, collections,
  onTabChange, onTabClose, onTabAdd, onRequestChange, onSendRequest,
  onSaveRequest, onUpdateRequest, onSaveAsNew, onCreateCollection, onOpenSidebar
}: RequestTabsProps) {
  const activeRequest = requests.find(r => r.id === activeTab);

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="glass-tab flex items-center min-h-[40px]">
        {/* Mobile menu */}
        <Button onClick={onOpenSidebar} size="sm" variant="ghost" className="h-8 w-8 p-0 ml-2 lg:hidden flex-shrink-0">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>

        {/* Tabs */}
        <div className="flex items-stretch overflow-x-auto scrollbar-hide flex-1">
          {requests.map(req => (
            <div
              key={req.id}
              className={cn(
                "group flex items-center gap-1.5 px-3 py-0 h-10 border-r border-white/5 cursor-pointer flex-shrink-0 relative select-none transition-colors",
                activeTab === req.id
                  ? "bg-background/60 tab-active-indicator"
                  : "bg-transparent hover:bg-white/5 text-muted-foreground"
              )}
              onClick={() => onTabChange(req.id)}
            >
              <span className={cn("text-xs font-bold", getMethodClass(req.method))}>{req.method}</span>
              <span className="max-w-24 lg:max-w-36 truncate text-xs">{req.name}</span>
              {responses[req.id] && (
                <span className={cn("text-xs opacity-60", responses[req.id].status >= 400 ? "text-red-400" : "text-green-400")}>
                  {responses[req.id].status}
                </span>
              )}
              <button
                className="opacity-0 group-hover:opacity-100 h-4 w-4 rounded hover:bg-white/10 flex items-center justify-center flex-shrink-0"
                onClick={e => { e.stopPropagation(); onTabClose(req.id); }}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>

        <Button onClick={onTabAdd} size="sm" variant="ghost" className="h-8 w-8 p-0 mx-1 flex-shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-3 lg:p-4 overflow-auto">
        {activeRequest ? (
          <RequestTab
            key={activeRequest.id}
            request={activeRequest}
            response={responses[activeRequest.id]}
            testResults={testResultsMap[activeRequest.id]?.results}
            scriptLogs={testResultsMap[activeRequest.id]?.logs}
            scriptError={testResultsMap[activeRequest.id]?.error}
            isLoading={loadingTabs.has(activeRequest.id)}
            collections={collections}
            hasChanges={false}
            onRequestChange={onRequestChange}
            onSendRequest={() => onSendRequest(activeRequest.id)}
            onCloseTab={() => onTabClose(activeRequest.id)}
            onSaveRequest={(name, cid) => onSaveRequest(activeRequest.id, name, cid)}
            onUpdateRequest={() => onUpdateRequest(activeRequest.id)}
            onSaveAsNew={(name, cid) => onSaveAsNew(activeRequest.id, name, cid)}
            onCreateCollection={onCreateCollection}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2 text-muted-foreground">No request open</h3>
              <Button onClick={onTabAdd} className="btn-send h-9 px-5">
                <Plus className="h-4 w-4 mr-2" />New Request
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
