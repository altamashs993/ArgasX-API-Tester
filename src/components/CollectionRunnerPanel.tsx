import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Square, CheckCircle2, XCircle, Loader2, Upload } from "lucide-react";
import { Collection } from "@/types";
import { CollectionRunner as Runner, RunnerRequestResult } from "@/services/collectionRunner";
import { StorageService } from "@/services/storageService";
import { cn } from "@/lib/utils";

interface CollectionRunnerPanelProps { open: boolean; onOpenChange: (o: boolean) => void; collection: Collection | null; }

function statusColor(s: number) { if (s >= 200 && s < 300) return "bg-green-600"; if (s >= 400) return "bg-red-600"; return "bg-zinc-600"; }

export function CollectionRunnerPanel({ open, onOpenChange, collection }: CollectionRunnerPanelProps) {
  const [results, setResults] = useState<RunnerRequestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [delay, setDelay] = useState(0);
  const [dataRows, setDataRows] = useState<Record<string, string>[]>([]);
  const abortRef = useRef(false);

  const handleRun = async () => {
    if (!collection) return;
    const requests = StorageService.getRequestsByCollection(collection.id);
    if (!requests.length) return;
    setResults([]); setRunning(true); abortRef.current = false;
    await Runner.run(requests, { delayMs: delay, dataRows }, (result) => {
      if (!abortRef.current) setResults(prev => [...prev, result]);
    });
    setRunning(false);
  };

  const handleDataFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    if (file.name.endsWith(".json")) { try { setDataRows(JSON.parse(text)); } catch {} }
    else if (file.name.endsWith(".csv")) {
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",");
      setDataRows(lines.slice(1).map(line => { const vals = line.split(","); return Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] ?? "").trim()])); }));
    }
  };

  const totalPassed = results.reduce((a, r) => a + r.passed, 0);
  const totalFailed = results.reduce((a, r) => a + r.failed, 0);
  const totalDuration = results.reduce((a, r) => a + r.duration, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 max-w-3xl h-[85vh] flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Play className="h-4 w-4 text-primary" />Runner — {collection?.name ?? "Collection"}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Delay (ms)</span>
            <Input type="number" value={delay} onChange={e => setDelay(Number(e.target.value))} className="h-8 w-20 text-xs bg-zinc-900 border-zinc-700" />
          </div>
          <label className="cursor-pointer">
            <input type="file" accept=".csv,.json" className="hidden" onChange={handleDataFile} />
            <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-zinc-700 rounded px-2 h-8">
              <Upload className="h-3 w-3" />{dataRows.length > 0 ? `${dataRows.length} rows` : "Data file (CSV/JSON)"}
            </div>
          </label>
          <Button onClick={handleRun} disabled={running} className="btn-send h-8 ml-auto">
            {running ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Running...</> : <><Play className="h-3 w-3 mr-2" />Run All</>}
          </Button>
          {running && <Button variant="ghost" size="sm" onClick={() => { abortRef.current = true; setRunning(false); }} className="h-8"><Square className="h-3 w-3 mr-1" />Stop</Button>}
        </div>
        {results.length > 0 && !running && (
          <div className="flex items-center gap-4 text-sm py-2 border-y border-white/5">
            <span className="text-muted-foreground">{results.length} requests</span>
            <span className="test-pass">{totalPassed} passed</span>
            {totalFailed > 0 && <span className="test-fail">{totalFailed} failed</span>}
            <span className="text-muted-foreground">{totalDuration}ms total</span>
          </div>
        )}
        <div className="flex-1 overflow-auto space-y-2">
          {results.map((r, i) => (
            <div key={i} className="glass-card rounded p-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-mono font-bold", `method-${r.method.toLowerCase()}`)}>{r.method}</span>
                <span className="flex-1 text-sm truncate">{r.requestName}</span>
                <Badge className={cn(statusColor(r.status), "text-white text-xs")}>{r.status}</Badge>
                <span className="text-xs text-muted-foreground">{r.duration}ms</span>
                {r.testResults.length > 0 && <span className={cn("text-xs", r.failed > 0 ? "test-fail" : "test-pass")}>{r.passed}/{r.testResults.length} tests</span>}
              </div>
              {r.testResults.map((t, ti) => (
                <div key={ti} className="flex items-center gap-2 pl-4 text-xs">
                  {t.passed ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                  <span>{t.name}</span>
                  {t.error && <span className="text-muted-foreground font-mono">— {t.error}</span>}
                </div>
              ))}
            </div>
          ))}
          {results.length === 0 && !running && <div className="text-center py-12 text-muted-foreground text-sm">Press Run All to execute the collection</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
