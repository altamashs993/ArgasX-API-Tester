import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { RequestTab } from "./RequestTab";
import { ApiRequest, ApiResponse, Collection } from "@/types";

interface RequestTabsProps {
  requests: ApiRequest[];
  responses: Record<string, ApiResponse>;
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
  onOpenSidebar: () => void;
  sidebarOpen: boolean;
}

export function RequestTabs({
  requests,
  responses,
  activeTab,
  loadingTabs,
  collections,
  onTabChange,
  onTabClose,
  onTabAdd,
  onRequestChange,
  onSendRequest,
  onSaveRequest,
  onUpdateRequest,
  onSaveAsNew,
  onOpenSidebar,
  sidebarOpen
}: RequestTabsProps) {
  const activeRequest = requests.find(r => r.id === activeTab);

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="flex items-center border-b bg-card">
        {/* Mobile menu button */}
        <Button
          onClick={onOpenSidebar}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 ml-2 lg:hidden"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
        
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {requests.map((request) => (
            <button
              key={request.id}
              onClick={() => onTabChange(request.id)}
              className={cn(
                "flex items-center space-x-2 px-3 lg:px-4 py-2 text-xs lg:text-sm border-r hover:bg-card-hover transition-colors whitespace-nowrap min-w-0 flex-shrink-0",
                activeTab === request.id ? "bg-background" : "bg-card"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                request.method === 'GET' && "bg-method-get",
                request.method === 'POST' && "bg-method-post",
                request.method === 'PUT' && "bg-method-put",
                request.method === 'DELETE' && "bg-method-delete",
                request.method === 'PATCH' && "bg-method-patch",
                !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) && "bg-muted"
              )} />
              <span className="max-w-20 lg:max-w-32 truncate">{request.name}</span>
              {responses[request.id] && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {responses[request.id].status}
                </span>
              )}
            </button>
          ))}
        </div>
        <Button
          onClick={onTabAdd}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 ml-2 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-2 lg:p-4 overflow-hidden">
        {activeRequest ? (
            <RequestTab
              key={activeRequest.id}
              request={activeRequest}
              response={responses[activeRequest.id]}
              isLoading={loadingTabs.has(activeRequest.id)}
              collections={collections}
              hasChanges={false}
              onRequestChange={onRequestChange}
              onSendRequest={() => onSendRequest(activeRequest.id)}
              onCloseTab={() => onTabClose(activeRequest.id)}
              onSaveRequest={(name, collectionId) => onSaveRequest(activeRequest.id, name, collectionId)}
              onUpdateRequest={() => onUpdateRequest(activeRequest.id)}
              onSaveAsNew={(name, collectionId) => onSaveAsNew(activeRequest.id, name, collectionId)}
            />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4">
              <h3 className="text-lg font-medium mb-2">No requests open</h3>
              <p className="text-muted-foreground mb-4 text-sm lg:text-base">
                Create a new request to get started
              </p>
              <Button onClick={onTabAdd} className="h-10 px-4">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}