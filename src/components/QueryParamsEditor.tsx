import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { QueryParam } from "@/types";

interface QueryParamsEditorProps { params: QueryParam[]; onChange: (params: QueryParam[]) => void; }

export function QueryParamsEditor({ params, onChange }: QueryParamsEditorProps) {
  const addParam = () => onChange([...params, { key: "", value: "", enabled: true }]);
  const update = (idx: number, updates: Partial<QueryParam>) => onChange(params.map((p, i) => i === idx ? { ...p, ...updates } : p));
  const remove = (idx: number) => onChange(params.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs text-muted-foreground px-1">
        <span className="w-4" /><span>Key</span><span>Value</span><span className="w-8" />
      </div>
      {params.map((p, idx) => (
        <div key={idx} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
          <Checkbox checked={p.enabled} onCheckedChange={v => update(idx, { enabled: !!v })} className="border-zinc-600" />
          <Input placeholder="Key" value={p.key} onChange={e => update(idx, { key: e.target.value })} className="h-8 text-sm bg-zinc-900 border-zinc-700 font-mono" />
          <Input placeholder="Value" value={p.value} onChange={e => update(idx, { value: e.target.value })} className="h-8 text-sm bg-zinc-900 border-zinc-700 font-mono" />
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => remove(idx)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addParam} className="h-7 text-xs text-muted-foreground hover:text-foreground">
        <Plus className="h-3 w-3 mr-1" />Add Parameter
      </Button>
    </div>
  );
}
