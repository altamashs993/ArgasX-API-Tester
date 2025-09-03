import { useState, useEffect } from "react";
import { RequestTabs } from "@/components/RequestTabs";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ApiRequest, ApiResponse } from "@/types";
import { HttpService, StorageService } from "@/services/httpService";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [savedRequests, setSavedRequests] = useState<ApiRequest[]>([]);
  const [responses, setResponses] = useState<Record<string, ApiResponse>>({});
  const [activeTab, setActiveTab] = useState<string>("");
  const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Load saved requests on mount
  useEffect(() => {
    const saved = StorageService.loadRequests();
    setSavedRequests(saved);
  }, []);

  // Save requests whenever they change
  useEffect(() => {
    StorageService.saveRequests(savedRequests);
  }, [savedRequests]);

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

  const handleSaveRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const existingIndex = savedRequests.findIndex(r => r.id === requestId);
    
    if (existingIndex >= 0) {
      setSavedRequests(prev => 
        prev.map(r => r.id === requestId ? request : r)
      );
      toast({
        title: "Request updated",
        description: `"${request.name}" has been updated`
      });
    } else {
      setSavedRequests(prev => [...prev, request]);
      toast({
        title: "Request saved",
        description: `"${request.name}" has been saved to your collection`
      });
    }
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

  const handleImportCollection = async () => {
    try {
      const imported = await StorageService.importRequests();
      if (imported) {
        setSavedRequests(prev => [...prev, ...imported]);
        toast({
          title: "Collection imported",
          description: `${imported.length} requests imported successfully`
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import collection",
        variant: "destructive"
      });
    }
  };

  const handleExportCollection = () => {
    try {
      StorageService.exportRequests(savedRequests);
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

  return (
    <ThemeProvider>
      <div className="h-screen bg-background flex">
        <Sidebar
          savedRequests={savedRequests}
          onRequestSelect={handleRequestSelect}
          onNewRequest={handleTabAdd}
          onImportCollection={handleImportCollection}
          onExportCollection={handleExportCollection}
        />
        <div className="flex-1 overflow-hidden">
          <RequestTabs
            requests={requests}
            responses={responses}
            activeTab={activeTab}
            loadingTabs={loadingTabs}
            collections={[]}
            onTabChange={setActiveTab}
            onTabClose={handleTabClose}
            onTabAdd={handleTabAdd}
            onRequestChange={handleRequestChange}
            onSendRequest={handleSendRequest}
            onSaveRequest={handleSaveRequest}
            onUpdateRequest={(id) => {}}
            onSaveAsNew={(id) => {}}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;
