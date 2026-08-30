import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { WrapText, Copy, Check } from "lucide-react";
import { ApiResponse } from "@/types";
import { cn } from "@/lib/utils";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

interface ResponseViewerProps { response: ApiResponse; }

function detectLang(data: string, headers: Record<string, string>) {
  const ct = Object.entries(headers).find(([k]) => k.toLowerCase() === "content-type")?.[1] ?? "";
  if (ct.includes("json")) return "json";
  if (ct.includes("xml")) return "xml";
  if (ct.includes("html")) return "html";
  if (ct.includes("javascript")) return "js";
  try { JSON.parse(data); return "json"; } catch {}
  if (data.trim().startsWith("<")) return ct.includes("svg") ? "xml" : "html";
  return "text";
}

function prettyPrint(data: string, lang: string): string {
  if (lang === "json") {
    try { return JSON.stringify(JSON.parse(data), null, 2); } catch {}
  }
  return data;
}

function StatusBadge({ status }: { status: number }) {
  let cls = "bg-zinc-700 text-zinc-300";
  if (status >= 200 && status < 300) cls = "bg-green-900/60 text-green-400 border border-green-800/50";
  else if (status >= 300 && status < 400) cls = "bg-blue-900/60 text-blue-400 border border-blue-800/50";
  else if (status >= 400 && status < 500) cls = "bg-yellow-900/60 text-yellow-400 border border-yellow-800/50";
  else if (status >= 500) cls = "bg-red-900/60 text-red-400 border border-red-800/50";
  return <span className={cn("px-2 py-0.5 rounded text-xs font-mono font-bold", cls)}>{status}</span>;
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  const [tab, setTab] = useState<"pretty" | "raw" | "headers">("pretty");
  const [wrapText, setWrapText] = useState(true);
  const [copied, setCopied] = useState(false);

  const lang = detectLang(response.data, response.headers);
  const prettyData = useMemo(() => prettyPrint(response.data, lang), [response.data, lang]);

  const extensions = useMemo(() => {
    const activeLang = tab === "pretty" ? lang : "text";
    const ext = [EditorView.theme({
      "&": { height: "100%" },
      ".cm-scroller": { overflow: "auto" }
    })];
    if (wrapText) ext.push(EditorView.lineWrapping);
    if (activeLang === "json") ext.push(json());
    else if (activeLang === "xml") ext.push(xml());
    else if (activeLang === "html") ext.push(html());
    else if (activeLang === "js") ext.push(javascript());
    return ext;
  }, [lang, tab, wrapText]);

  const copyResponse = async () => {
    await navigator.clipboard.writeText(response.data);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const sizeLabel = response.size < 1024
    ? `${response.size} B`
    : response.size < 1024 * 1024
    ? `${(response.size / 1024).toFixed(1)} KB`
    : `${(response.size / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Response meta bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/5 flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground">Response</span>
        <StatusBadge status={response.status} />
        <span className="text-xs text-muted-foreground">{response.statusText}</span>
        <span className="text-xs text-muted-foreground ml-auto">{response.time}ms</span>
        <span className="text-xs text-muted-foreground">{sizeLabel}</span>
      </div>

      {/* Tabs + actions */}
      <div className="flex items-center justify-between border-b border-white/5 px-1 flex-shrink-0">
        <div className="flex">
          {(["pretty", "raw", "headers"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-2 text-xs font-medium capitalize transition-colors relative",
                tab === t ? "text-foreground tab-active-indicator" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 pr-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWrapText(!wrapText)}
            className={cn("h-7 px-2 text-xs gap-1 transition-colors", wrapText ? "text-primary bg-primary/10 border border-primary/30" : "text-muted-foreground")}
            title="Toggle text wrap"
          >
            <WrapText className="h-3.5 w-3.5" />
            <span>Wrap</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={copyResponse} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Copy response">
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={cn("flex-1 overflow-auto min-h-0", wrapText && "cm-line-wrap")}>
        {(tab === "pretty" || tab === "raw") && (
          <CodeMirror
            key={`${tab}-${wrapText}`}
            value={tab === "pretty" ? prettyData : response.data}
            height="100%"
            theme={oneDark}
            extensions={extensions}
            readOnly
            basicSetup={{ lineNumbers: true, foldGutter: tab === "pretty", highlightActiveLineGutter: false }}
            className="h-full"
          />
        )}
        {tab === "headers" && (
          <div className="p-3 space-y-1">
            {Object.entries(response.headers).length === 0 ? (
              <p className="text-xs text-muted-foreground">No headers</p>
            ) : Object.entries(response.headers).map(([k, v]) => (
              <div key={k} className="flex items-start gap-3 py-1.5 border-b border-white/5 last:border-0">
                <span className="text-xs font-mono text-muted-foreground w-48 flex-shrink-0 truncate">{k}</span>
                <span className="text-xs font-mono text-foreground break-all">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
