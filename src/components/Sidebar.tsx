import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Import, Download, Settings, X, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiRequest, Collection, RequestHistory } from "@/types";
import { CollectionsPanel } from "./CollectionsPanel";
import { HistoryPanel } from "./HistoryPanel";
import { EnvironmentPanel } from "./EnvironmentPanel";
import { CollectionRunnerPanel } from "./CollectionRunnerPanel";
import { CreateCollectionDialog } from "./CreateCollectionDialog";
import { SettingsDialog } from "./SettingsDialog";
import { StorageService } from "@/services/storageService";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  onClose?: () => void;
}

type SidebarTab = "collections" | "history" | "environments";

export function Sidebar({
  collections, history, onRequestSelect, onNewRequest, onCreateCollection,
  onImportCollection, onExportCollection, onCollectionsChange, onHistoryChange, onClose
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("collections");
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [runnerCollection, setRunnerCollection] = useState<Collection | null>(null);

  const handleCreateCollection = (name: string, description: string) => {
    onCreateCollection(name, description);
    setShowCreateCollection(false);
  };

  return (
    <div className="w-64 lg:w-72 glass-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
        <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">ArgasX</span>
        <div className="flex items-center gap-1">
          {onClose && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 lg:hidden" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowSettings(true)}>
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700">
              <DropdownMenuItem onClick={onImportCollection}><Import className="h-3.5 w-3.5 mr-2" />Import Collection</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExportCollection()}><Download className="h-3.5 w-3.5 mr-2" />Export All</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* New Request */}
      <div className="px-3 py-2 border-b border-white/5">
        <Button onClick={onNewRequest} className="w-full h-8 text-xs btn-send">
          <Plus className="h-3.5 w-3.5 mr-1.5" />New Request
        </Button>
      </div>

      {/* Tab selector */}
      <div className="flex border-b border-white/5">
        {(["collections", "history", "environments"] as SidebarTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-xs font-medium capitalize transition-colors relative",
              activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "environments" ? "Env" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-px bg-primary" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "collections" && (
          <CollectionsPanel
            collections={collections}
            requests={StorageService.getRequests()}
            onRequestSelect={onRequestSelect}
            onCreateCollection={(c) => { onCreateCollection(c.name, c.description); }}
            onUpdateCollection={(id, updates) => { StorageService.updateCollection(id, updates); onCollectionsChange(StorageService.getCollections()); }}
            onDeleteCollection={(id) => { StorageService.deleteCollection(id); onCollectionsChange(StorageService.getCollections()); }}
            onDeleteRequestFromCollection={(id) => { StorageService.deleteRequest(id); onCollectionsChange(StorageService.getCollections()); }}
            onImportCollection={onImportCollection}
            onExportCollection={onExportCollection}
            onRunCollection={(c) => setRunnerCollection(c)}
          />
        )}
        {activeTab === "history" && (
          <HistoryPanel
            history={history}
            onHistoryItemSelect={(item) => {
              if (item.request) {
                onRequestSelect({ ...item.request, id: `history-${item.id}`, name: `${item.request.name} (from history)` });
              } else {
                const req = StorageService.getRequests().find(r => r.id === item.requestId);
                if (req) onRequestSelect(req);
              }
            }}
            onClearHistory={() => { StorageService.clearHistory(); onHistoryChange([]); }}
            onDeleteHistoryItem={(id) => { StorageService.deleteHistoryItem(id); onHistoryChange(StorageService.getHistory()); }}
            onUpdateHistoryItem={(id, updates) => { StorageService.updateHistoryItem(id, updates); onHistoryChange(StorageService.getHistory()); }}
          />
        )}
        {activeTab === "environments" && <EnvironmentPanel />}
      </div>

      <CreateCollectionDialog open={showCreateCollection} onOpenChange={setShowCreateCollection} onCreateCollection={(c) => handleCreateCollection(c.name, c.description)} />
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      <CollectionRunnerPanel open={!!runnerCollection} onOpenChange={(o) => { if (!o) setRunnerCollection(null); }} collection={runnerCollection} />
    </div>
  );
}
