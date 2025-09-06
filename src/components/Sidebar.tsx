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
  Download,
  Settings,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiRequest, Collection, RequestHistory } from "@/types";
import { CollectionsPanel } from "./CollectionsPanel";
import { HistoryPanel } from "./HistoryPanel";
import { CreateCollectionDialog } from "./CreateCollectionDialog";
import { SettingsDialog } from "./SettingsDialog";
import { StorageService } from "../services/storageService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  collections: Collection[];
  history: RequestHistory[];
  onRequestSelect: (request: ApiRequest) => void;
  onNewRequest: () => void;
  onCreateCollection: (name: string, description: string) => Collection;
  onImportCollection: () => void;
  onExportCollection: (collectionId?: string) => void;
  onCollectionsChange: (collections: Collection[]) => void;
  onHistoryChange: (history: RequestHistory[]) => void;
}

export function Sidebar({
  collections,
  history,
  onRequestSelect,
  onNewRequest,
  onCreateCollection,
  onImportCollection,
  onExportCollection,
  onCollectionsChange,
  onHistoryChange
}: SidebarProps) {
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleCreateCollection = (name: string, description: string) => {
    onCreateCollection(name, description);
    setShowCreateCollection(false);
  };

  return (
    <div className="w-80 bg-card border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">ARGASX API TESTER</h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
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
                <DropdownMenuItem onClick={() => onExportCollection()}>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Collections
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Button onClick={onNewRequest} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="collections" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="collections" className="flex-1 overflow-hidden">
            <CollectionsPanel
              collections={collections}
              requests={StorageService.getRequests()}
              onRequestSelect={onRequestSelect}
              onCreateCollection={(collection) => {
                const newCollection = onCreateCollection(collection.name, collection.description);
                return newCollection;
              }}
              onUpdateCollection={(id, updates) => {
                StorageService.updateCollection(id, updates);
                onCollectionsChange(StorageService.getCollections());
              }}
              onDeleteCollection={(id) => {
                StorageService.deleteCollection(id);
                onCollectionsChange(StorageService.getCollections());
              }}
              onImportCollection={onImportCollection}
              onExportCollection={onExportCollection}
            />
          </TabsContent>
          
          <TabsContent value="history" className="flex-1 overflow-hidden">
            <HistoryPanel 
              history={history} 
              onHistoryItemSelect={(historyItem) => {
                // Find the request by ID and open it
                const requests = StorageService.getRequests();
                const request = requests.find(r => r.id === historyItem.requestId);
                if (request) {
                  onRequestSelect(request);
                }
              }}
              onClearHistory={() => {
                StorageService.clearHistory();
                onHistoryChange([]);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateCollectionDialog
        open={showCreateCollection}
        onOpenChange={setShowCreateCollection}
        onCreateCollection={(collection) => {
          handleCreateCollection(collection.name, collection.description);
        }}
      />
      
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}