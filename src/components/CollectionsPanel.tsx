import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FolderPlus, Search, MoreHorizontal, Trash2, Download, Upload, Play, Folder, FolderOpen, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Collection, ApiRequest } from "@/types";
import { CreateCollectionDialog } from "./CreateCollectionDialog";
import { cn } from "@/lib/utils";

interface CollectionsPanelProps {
  collections: Collection[];
  requests: ApiRequest[];
  onCreateCollection: (collection: Omit<Collection, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateCollection: (id: string, updates: Partial<Collection>) => void;
  onDeleteCollection: (id: string) => void;
  onRequestSelect: (request: ApiRequest) => void;
  onDeleteRequestFromCollection: (requestId: string) => void;
  onImportCollection: () => void;
  onExportCollection: (collectionId?: string) => void;
  onRunCollection?: (collection: Collection) => void;
}

function methodClass(m: string) {
  const u = m.toUpperCase();
  if (u === "GET") return "method-get";
  if (u === "POST") return "method-post";
  if (u === "PUT") return "method-put";
  if (u === "DELETE") return "method-delete";
  if (u === "PATCH") return "method-patch";
  return "text-muted-foreground";
}

export function CollectionsPanel({
  collections, requests, onCreateCollection, onUpdateCollection, onDeleteCollection,
  onRequestSelect, onDeleteRequestFromCollection, onImportCollection, onExportCollection, onRunCollection
}: CollectionsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filtered = collections.filter(c => {
    const nameStr = typeof c.name === "string" ? c.name : String((c.name as any)?.name || "Unnamed Collection");
    const descStr = typeof c.description === "string" ? c.description : String((c.description as any)?.description || "");
    return nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
           descStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getRequests = (id: string) => requests.filter(r => r.collectionId === id);

  const toggleCollection = (id: string) => {
    setExpandedCollections(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search & Actions Header */}
      <div className="p-3 border-b border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collections</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={onImportCollection} title="Import Collection">
              <Upload className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => onExportCollection()} title="Export Collections">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => setCreateDialogOpen(true)} title="New Collection">
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Filter collections..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-7 h-7 text-xs bg-zinc-900 border-zinc-700" />
        </div>
      </div>

      {/* Collection Tree */}
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
            <FolderPlus className="h-8 w-8 opacity-30" />
            <p className="text-xs">No collections found</p>
            <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)} className="h-7 text-xs border-zinc-700">
              Create Collection
            </Button>
          </div>
        ) : (
          filtered.map(collection => {
            const collReqs = getRequests(collection.id);
            const isExpanded = expandedCollections.has(collection.id);
            return (
              <Collapsible key={collection.id} open={isExpanded} onOpenChange={() => toggleCollection(collection.id)}>
                <div className="rounded-lg border border-white/5 bg-zinc-900/40 overflow-hidden mb-1">
                  {/* Collection Header */}
                  <div className="flex items-center px-2 py-1.5 hover:bg-white/5 transition-colors group">
                    <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left min-w-0 py-0.5">
                      {isExpanded ? <FolderOpen className="h-3.5 w-3.5 text-primary flex-shrink-0" /> : <Folder className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                      <span className="text-xs font-semibold truncate flex-1 text-foreground">{collection.name}</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-zinc-800 text-zinc-400 font-mono flex-shrink-0">
                        {collReqs.length}
                      </Badge>
                    </CollapsibleTrigger>

                    {/* Collection Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-zinc-900 border-zinc-700">
                        {onRunCollection && (
                          <DropdownMenuItem onClick={() => onRunCollection(collection)} className="text-xs gap-2">
                            <Play className="h-3.5 w-3.5 text-primary" /> Run Collection
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onExportCollection(collection.id)} className="text-xs gap-2">
                          <Download className="h-3.5 w-3.5" /> Export Collection
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive" onClick={() => onDeleteCollection(collection.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete Collection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Requests inside collection */}
                  <CollapsibleContent className="pl-4 pr-1 py-1 space-y-0.5 border-t border-white/5 bg-black/20">
                    {collReqs.map(req => (
                      <div
                        key={req.id}
                        className="group/req flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/10 cursor-pointer transition-colors"
                        onClick={() => onRequestSelect(req)}
                      >
                        <span className={cn("text-[10px] font-mono font-bold w-10 flex-shrink-0", methodClass(req.method))}>
                          {req.method}
                        </span>
                        <span className="text-xs truncate flex-1 text-foreground/90 font-medium">{req.name}</span>

                        {/* Request Item Dropdown Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover/req:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-700">
                            <DropdownMenuItem onClick={() => onRequestSelect(req)} className="text-xs gap-2">
                              <ExternalLink className="h-3.5 w-3.5" /> Open Request
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem
                              className="text-xs gap-2 text-destructive focus:text-destructive"
                              onClick={e => {
                                e.stopPropagation();
                                onDeleteRequestFromCollection(req.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete Request
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                    {collReqs.length === 0 && (
                      <p className="text-[11px] text-muted-foreground text-center py-2 italic">No requests saved yet</p>
                    )}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </div>

      <CreateCollectionDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onCreateCollection={onCreateCollection} />
    </div>
  );
}
