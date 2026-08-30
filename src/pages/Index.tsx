import { useState, useEffect } from "react";
import { RequestTabs } from "@/components/RequestTabs";
import { Sidebar } from "@/components/Sidebar";
import { ApiRequest, ApiResponse, Collection, RequestHistory, TestResult } from "@/types";
import { HttpService } from "@/services/httpService";
import { StorageService } from "@/services/storageService";
import { ScriptRunner } from "@/services/scriptRunner";
import { EnvironmentService } from "@/services/environmentService";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [responses, setResponses] = useState<Record<string, ApiResponse>>({});
  const [testResultsMap, setTestResultsMap] = useState<Record<string, { results: TestResult[]; logs: string[]; error?: string }>>({});
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  // Load data on mount
  useEffect(() => {
    setCollections(StorageService.getCollections());
    setHistory(StorageService.getHistory());

    try {
      const savedRequests = localStorage.getItem('argasx-active-requests');
      const savedActiveTab = localStorage.getItem('argasx-active-tab');
      const savedResponses = localStorage.getItem('argasx-active-responses');
      if (savedRequests) setRequests(JSON.parse(savedRequests));
      if (savedActiveTab) setActiveTab(savedActiveTab);
      if (savedResponses) setResponses(JSON.parse(savedResponses));
    } catch (e) {
      console.error('Failed to load session state', e);
    }
  }, []);

  // Save session state when it changes
  useEffect(() => {
    localStorage.setItem('argasx-active-requests', JSON.stringify(requests));
    localStorage.setItem('argasx-active-tab', activeTab);
    localStorage.setItem('argasx-active-responses', JSON.stringify(responses));
  }, [requests, activeTab, responses]);

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
      let envVars = EnvironmentService.getActiveVars();

      if (request.preRequestScript) {
        const preResult = ScriptRunner.run(request.preRequestScript, null, envVars);
        envVars = { ...envVars, ...preResult.updatedEnv };
        EnvironmentService.updateActiveVars(preResult.updatedEnv);
      }

      const resolvedRequest = EnvironmentService.resolveRequest(request, envVars);
      const response = await HttpService.sendRequest(resolvedRequest);
      setResponses(prev => ({ ...prev, [requestId]: response }));

      let testResults: TestResult[] = [];
      let logs: string[] = [];
      let scriptError: string | undefined;

      if (request.testScript) {
        const postResult = ScriptRunner.run(request.testScript, response, envVars);
        testResults = postResult.testResults;
        logs = postResult.logs;
        scriptError = postResult.error;
        EnvironmentService.updateActiveVars(postResult.updatedEnv);
      }

      setTestResultsMap(prev => ({ ...prev, [requestId]: { results: testResults, logs, error: scriptError } }));

      StorageService.addToHistory({
        requestId: request.id,
        method: request.method,
        url: request.url,
        status: response.status,
        request,
        response,
        isFavorite: false
      });
      setHistory(StorageService.getHistory());

      const passCount = testResults.filter(t => t.passed).length;
      const testSummary = testResults.length > 0 ? ` • ${passCount}/${testResults.length} tests passed` : '';

      toast({
        title: `${response.status} ${response.statusText}`,
        description: `${response.time}ms${testSummary}`
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
    const existingTab = requests.find(r => r.id === savedRequest.id);
    if (existingTab) {
      setActiveTab(savedRequest.id);
      return;
    }

    setRequests(prev => [...prev, savedRequest]);
    setActiveTab(savedRequest.id);
  };

  const handleCreateCollection = (nameOrObj: any, descriptionArg?: string) => {
    let nameStr = "";
    let descStr = "";
    if (typeof nameOrObj === "object" && nameOrObj !== null) {
      nameStr = typeof nameOrObj.name === "string" ? nameOrObj.name : String(nameOrObj.name || "");
      descStr = typeof nameOrObj.description === "string" ? nameOrObj.description : String(nameOrObj.description || "");
    } else {
      nameStr = String(nameOrObj || "");
      descStr = String(descriptionArg || "");
    }
    const collection = StorageService.createCollection({ name: nameStr, description: descStr });
    setCollections(StorageService.getCollections());
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

  useEffect(() => {
    const savedRequests = localStorage.getItem('argasx-active-requests');
    if (!savedRequests || JSON.parse(savedRequests).length === 0) {
      if (requests.length === 0) {
        handleTabAdd();
      }
    }
  }, []);

  return (
    <div className="h-screen bg-background flex relative dark">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:relative z-50 lg:z-auto transition-transform duration-300 ease-in-out`}>
        <Sidebar
          collections={collections}
          history={history}
          onRequestSelect={(request) => {
            handleRequestSelect(request);
            setSidebarOpen(false);
          }}
          onNewRequest={() => {
            handleTabAdd();
            setSidebarOpen(false);
          }}
          onCreateCollection={handleCreateCollection}
          onImportCollection={handleImportCollection}
          onExportCollection={handleExportCollection}
          onCollectionsChange={setCollections}
          onHistoryChange={setHistory}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 overflow-hidden min-w-0">
        <RequestTabs
          requests={requests}
          responses={responses}
          testResultsMap={testResultsMap}
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
          onCreateCollection={handleCreateCollection}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      </div>
    </div>
  );
};

export default Index;
