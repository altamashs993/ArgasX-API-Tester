import { CheckCircle2, XCircle, Terminal, ChevronDown, ChevronRight } from "lucide-react";
import { TestResult } from "@/types";
import { useState } from "react";

interface TestResultsPanelProps { testResults: TestResult[]; logs: string[]; scriptError?: string; }

export function TestResultsPanel({ testResults, logs, scriptError }: TestResultsPanelProps) {
  const [showLogs, setShowLogs] = useState(false);
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;
  if (testResults.length === 0 && logs.length === 0 && !scriptError) {
    return <div className="text-center py-8 text-muted-foreground text-sm">No test results. Add assertions in the Tests script tab.</div>;
  }
  return (
    <div className="space-y-3">
      {scriptError && <div className="glass-card rounded p-3 border border-red-900/30"><p className="text-xs text-destructive font-mono">Script Error: {scriptError}</p></div>}
      {testResults.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-3 text-xs">
            <span className="test-pass font-medium">{passed} passing</span>
            {failed > 0 && <span className="test-fail font-medium">{failed} failing</span>}
          </div>
          {testResults.map((t, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-white/5">
              {t.passed ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />}
              <div><p className="text-sm">{t.name}</p>{t.error && <p className="text-xs text-muted-foreground font-mono mt-0.5">{t.error}</p>}</div>
            </div>
          ))}
        </div>
      )}
      {logs.length > 0 && (
        <div>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1" onClick={() => setShowLogs(!showLogs)}>
            {showLogs ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <Terminal className="h-3 w-3" /> Console ({logs.length})
          </button>
          {showLogs && <div className="glass-card rounded p-2 space-y-1">{logs.map((l, i) => <p key={i} className="text-xs font-mono text-muted-foreground">{l}</p>)}</div>}
        </div>
      )}
    </div>
  );
}
