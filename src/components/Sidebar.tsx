import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  FolderOpen, 
  FileText, 
  Play, 
  MoreHorizontal,
  Import,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiRequest } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  savedRequests: ApiRequest[];
  onRequestSelect: (request: ApiRequest) => void;
  onNewRequest: () => void;
  onImportCollection: () => void;
  onExportCollection: () => void;
}

export function Sidebar({
  savedRequests,
  onRequestSelect,
  onNewRequest,
  onImportCollection,
  onExportCollection
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const filteredRequests = savedRequests.filter(request =>
    request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="w-80 bg-card border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">LightPostman</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onImportCollection}>
                <Import className="h-4 w-4 mr-2" />
                Import Collection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportCollection}>
                <Download className="h-4 w-4 mr-2" />
                Export Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button onClick={onNewRequest} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No requests match your search" : "No saved requests yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRequests.map((request) => (
              <Card
                key={request.id}
                className={cn(
                  "p-3 cursor-pointer hover:bg-card-hover transition-colors",
                  "border-l-4 border-l-transparent hover:border-l-primary"
                )}
                onClick={() => onRequestSelect(request)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      getMethodColor(request.method)
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{request.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {request.method} {request.url || 'No URL'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestSelect(request);
                    }}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-center">
        <p className="text-xs text-muted-foreground">
          {savedRequests.length} saved request{savedRequests.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}