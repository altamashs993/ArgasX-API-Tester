import { useState, useEffect } from "react";
import { RequestTabs } from "@/components/RequestTabs";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ApiRequest, ApiResponse, Collection, RequestHistory } from "@/types";
import { HttpService } from "@/services/httpService";
import { StorageService } from "@/services/storageService";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [responses, setResponses] = useState<Record<string, ApiResponse>>({});
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Load data on mount
  useEffect(() => {
    setCollections(StorageService.getCollections());
    setHistory(StorageService.getHistory());
  }, []);

  const createNewRequest = (): ApiRequest => ({
    id: crypto.randomUUID(),
    name: `Request ${requests.length + 1}`,
    method: 'GET',
    url: '',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true }
    ],
    body: '',
    bodyType: 'raw',
    rawFormat: 'text',
    formData: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const handleTabAdd = () => {
    const newRequest = createNewRequest();
    setRequests(prev => [...prev, newRequest]);
    setActiveTab(newRequest.id);
  };

  const handleTabClose = (tabId: string) => {
    setRequests(prev => {
      const filtered = prev.filter(r => r.id !== tabId);
      if (activeTab === tabId && filtered.length > 0) {
        setActiveTab(filtered[filtered.length - 1].id);
      } else if (filtered.length === 0) {
        setActiveTab("");
      }
      return filtered;
    });
    
    // Clean up response
    setResponses(prev => {
      const { [tabId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const handleRequestChange = (updatedRequest: ApiRequest) => {
    setRequests(prev => 
      prev.map(req => req.id === updatedRequest.id ? updatedRequest : req)
    );
  };

  const handleSendRequest = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    setLoadingTabs(prev => new Set([...prev, requestId]));
    
    try {
      const response = await HttpService.sendRequest(request);
      setResponses(prev => ({ ...prev, [requestId]: response }));
      
      // Add to history
      StorageService.addToHistory({
        requestId: request.id,
        method: request.method,
        url: request.url,
        status: response.status
      });
      setHistory(StorageService.getHistory());
      
      toast({
        title: "Request completed",
        description: `${response.status} ${response.statusText} • ${response.time}ms`
      });
    } catch (error) {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoadingTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleSaveRequest = (requestId: string, name: string, collectionId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const updatedRequest = { ...request, name, collectionId };
    const savedRequest = StorageService.saveRequest(updatedRequest);
    
    // Update the current tab with the saved request
    setRequests(prev => prev.map(r => r.id === requestId ? savedRequest : r));
    
    toast({
      title: "Request saved",
      description: `"${name}" has been saved to collection`
    });
  };

  const handleUpdateRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    StorageService.updateRequest(request.id, request);
    toast({
      title: "Request updated",
      description: `"${request.name}" has been updated`
    });
  };

  const handleSaveAsNew = (requestId: string, name: string, collectionId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const newRequest = { ...request, name, collectionId };
    delete (newRequest as any).id;
    const savedRequest = StorageService.saveRequest(newRequest);
    
    toast({
      title: "Request saved as new",
      description: `"${name}" has been saved as a new request`
    });
  };

  const handleRequestSelect = (savedRequest: ApiRequest) => {
    // Check if request is already open
    const existingTab = requests.find(r => r.id === savedRequest.id);
    if (existingTab) {
      setActiveTab(savedRequest.id);
      return;
    }

    // Open new tab with the saved request
    setRequests(prev => [...prev, savedRequest]);
    setActiveTab(savedRequest.id);
  };

  const handleCreateCollection = (name: string, description: string) => {
    const collection = StorageService.createCollection({ name, description });
    setCollections(prev => [...prev, collection]);
    return collection;
  };

  const handleImportCollection = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        const text = await file.text();
        const data = JSON.parse(text);
        const { collections: importedCollections, requests: importedRequests } = StorageService.importPostmanCollection(data);
        
        setCollections(prev => [...prev, ...importedCollections]);
        
        toast({
          title: "Collection imported",
          description: `${importedRequests.length} requests imported successfully`
        });
      };
      
      input.click();
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import collection",
        variant: "destructive"
      });
    }
  };

  const handleExportCollection = (collectionId?: string) => {
    try {
      const data = StorageService.exportCollection(collectionId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = collectionId ? 
        `${collections.find(c => c.id === collectionId)?.name || 'collection'}.json` : 
        'argasx-collections.json';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Collection exported",
        description: "Your collection has been downloaded"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export collection",
        variant: "destructive"
      });
    }
  };

  // Initialize with one tab if none exist
  useEffect(() => {
    if (requests.length === 0) {
      handleTabAdd();
    }
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="h-screen bg-background flex relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-50 lg:z-auto transition-transform duration-300 ease-in-out`}>
          <Sidebar
            collections={collections}
            history={history}
            onRequestSelect={(request) => {
              handleRequestSelect(request);
              setSidebarOpen(false); // Close sidebar on mobile after selection
            }}
            onNewRequest={() => {
              handleTabAdd();
              setSidebarOpen(false); // Close sidebar on mobile after creating new request
            }}
            onCreateCollection={handleCreateCollection}
            onImportCollection={handleImportCollection}
            onExportCollection={handleExportCollection}
            onCollectionsChange={setCollections}
            onHistoryChange={setHistory}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-hidden min-w-0">
          <RequestTabs
            requests={requests}
            responses={responses}
            activeTab={activeTab}
            loadingTabs={loadingTabs}
            collections={collections}
            onTabChange={setActiveTab}
            onTabClose={handleTabClose}
            onTabAdd={handleTabAdd}
            onRequestChange={handleRequestChange}
            onSendRequest={handleSendRequest}
            onSaveRequest={handleSaveRequest}
            onUpdateRequest={handleUpdateRequest}
            onSaveAsNew={handleSaveAsNew}
            onOpenSidebar={() => setSidebarOpen(true)}
            sidebarOpen={sidebarOpen}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;
