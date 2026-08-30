import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Star, Search, Clock, ChevronDown } from "lucide-react";
import { RequestHistory } from "@/types";
import { cn } from "@/lib/utils";

interface HistoryPanelProps {
  history: RequestHistory[];
  onHistoryItemSelect: (item: RequestHistory) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onUpdateHistoryItem: (id: string, updates: Partial<RequestHistory>) => void;
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

function statusColor(s: number) {
  if (s >= 200 && s < 300) return "text-green-500";
  if (s >= 400 && s < 500) return "text-yellow-500";
  if (s >= 500) return "text-red-500";
  return "text-muted-foreground";
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  } catch { return ""; }
}

export function HistoryPanel({ history, onHistoryItemSelect, onClearHistory, onDeleteHistoryItem, onUpdateHistoryItem }: HistoryPanelProps) {
  const [search, setSearch] = useState("");
  const [showFavOnly, setShowFavOnly] = useState(false);

  const filtered = history.filter(h => {
    const matchSearch = !search || h.url.toLowerCase().includes(search.toLowerCase()) || h.method.toLowerCase().includes(search.toLowerCase());
    const matchFav = !showFavOnly || h.isFavorite;
    return matchSearch && matchFav;
  });

  const favCount = history.filter(h => h.isFavorite).length;

  return (
    <div className="h-full flex flex-col">
      {/* Search + filters */}
      <div className="p-3 space-y-2 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Filter history..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-xs" />
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFavOnly(!showFavOnly)}
            className={cn("flex items-center gap-1.5 text-xs transition-colors", showFavOnly ? "text-yellow-400" : "text-muted-foreground hover:text-foreground")}
          >
            <Star className={cn("h-3 w-3", showFavOnly && "fill-yellow-400")} />
            Favorites {favCount > 0 && <span className="text-xs opacity-70">({favCount})</span>}
          </button>
          {history.length > 0 && (
            <button onClick={onClearHistory} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Clock className="h-8 w-8 opacity-30" />
            <p className="text-xs">{history.length === 0 ? "No history yet" : "No results"}</p>
          </div>
        ) : (
          <div className="p-2 space-y-px">
            {filtered.map(item => (
              <div
                key={item.id}
                className="group flex items-center gap-2 px-2 py-2 rounded-md hover-row cursor-pointer"
                onClick={() => onHistoryItemSelect(item)}
              >
                <span className={cn("text-xs font-bold w-14 flex-shrink-0 truncate", methodClass(item.method))}>
                  {item.method}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate text-foreground">{item.url}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(item.timestamp)}</p>
                </div>
                <span className={cn("text-xs font-mono flex-shrink-0", statusColor(item.status))}>{item.status}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    className={cn("h-6 w-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors", item.isFavorite && "text-yellow-400")}
                    onClick={e => { e.stopPropagation(); onUpdateHistoryItem(item.id, { isFavorite: !item.isFavorite }); }}
                  >
                    <Star className={cn("h-3 w-3", item.isFavorite && "fill-yellow-400")} />
                  </button>
                  <button
                    className="h-6 w-6 rounded flex items-center justify-center hover:bg-red-900/30 hover:text-red-400 transition-colors text-muted-foreground"
                    onClick={e => { e.stopPropagation(); onDeleteHistoryItem(item.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
