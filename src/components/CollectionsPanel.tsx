import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FolderPlus, 
  Search, 
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Collection, ApiRequest } from '@/types';
import { CreateCollectionDialog } from './CreateCollectionDialog';

interface CollectionsPanelProps {
  collections: Collection[];
  requests: ApiRequest[];
  onCreateCollection: (collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateCollection: (id: string, updates: Partial<Collection>) => void;
  onDeleteCollection: (id: string) => void;
  onRequestSelect: (request: ApiRequest) => void;
  onImportCollection: () => void;
  onExportCollection: (collectionId?: string) => void;
}

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

export function CollectionsPanel({
  collections,
  requests,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onRequestSelect,
  onImportCollection,
  onExportCollection
}: CollectionsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRequestsForCollection = (collectionId: string) => {
    return requests.filter(request => request.collectionId === collectionId);
  };

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Collections</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onImportCollection}
              className="h-8 w-8 p-0"
              title="Import Collection"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExportCollection()}
              className="h-8 w-8 p-0"
              title="Export All"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="h-8 w-8 p-0"
              title="Create Collection"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {filteredCollections.length === 0 ? (
          <div className="text-center py-8">
            <FolderPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No collections yet</p>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          </div>
        ) : (
          filteredCollections.map((collection) => {
            const collectionRequests = getRequestsForCollection(collection.id);
            const isExpanded = expandedCollections.has(collection.id);
            
            return (
              <Collapsible
                key={collection.id}
                open={isExpanded}
                onOpenChange={() => toggleCollection(collection.id)}
              >
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center space-x-2 flex-1 text-left hover:bg-muted/50 rounded p-2 -m-2">
                      <div className="flex-1">
                        <h3 className="font-medium">{collection.name}</h3>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {collectionRequests.length}
                      </Badge>
                    </CollapsibleTrigger>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExportCollection(collection.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onDeleteCollection(collection.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CollapsibleContent className="space-y-1 mt-2">
                    {collectionRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => onRequestSelect(request)}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full ${getMethodColor(request.method)}`} />
                        <span className="text-xs font-mono uppercase text-muted-foreground min-w-[50px]">
                          {request.method}
                        </span>
                        <span className="text-sm truncate flex-1">{request.name}</span>
                      </div>
                    ))}
                    {collectionRequests.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No requests in this collection
                      </p>
                    )}
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })
        )}
      </div>

      <CreateCollectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateCollection={onCreateCollection}
      />
    </div>
  );
}