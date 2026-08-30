import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit, Globe } from "lucide-react";
import { EnvironmentService } from "@/services/environmentService";
import { Environment, EnvVariable } from "@/types";

export function EnvironmentPanel() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [editEnv, setEditEnv] = useState<Environment | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");

  const reload = () => { setEnvironments(EnvironmentService.getAll()); setActiveId(EnvironmentService.getActiveId()); };
  useEffect(() => { reload(); }, []);

  const handleCreate = () => {
    if (!newEnvName.trim()) return;
    EnvironmentService.create(newEnvName.trim());
    setNewEnvName(""); setShowCreate(false); reload();
  };
  const handleSelect = (id: string) => { EnvironmentService.setActiveId(id === "none" ? "" : id); reload(); };
  const handleDelete = (id: string) => { EnvironmentService.delete(id); reload(); if (editEnv?.id === id) setEditEnv(null); };
  const updateVariable = (idx: number, updates: Partial<EnvVariable>) => {
    if (!editEnv) return;
    const vars = editEnv.variables.map((v, i) => i === idx ? { ...v, ...updates } : v);
    const updated = { ...editEnv, variables: vars };
    setEditEnv(updated); EnvironmentService.update(updated.id, { variables: vars });
  };
  const addVariable = () => {
    if (!editEnv) return;
    const vars = [...editEnv.variables, { key: "", value: "", enabled: true }];
    const updated = { ...editEnv, variables: vars };
    setEditEnv(updated); EnvironmentService.update(updated.id, { variables: vars });
  };
  const removeVariable = (idx: number) => {
    if (!editEnv) return;
    const vars = editEnv.variables.filter((_, i) => i !== idx);
    const updated = { ...editEnv, variables: vars };
    setEditEnv(updated); EnvironmentService.update(updated.id, { variables: vars });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />Environments</h2>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /></Button>
        </div>
        <Select value={activeId || "none"} onValueChange={handleSelect}>
          <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-700"><SelectValue placeholder="No Environment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Environment</SelectItem>
            {environments.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-1">
        {environments.map(env => (
          <div key={env.id} className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-white/5 transition-colors ${activeId === env.id ? "bg-white/5 border border-white/10" : ""}`}>
            <span className="flex-1 text-sm truncate">{env.name}</span>
            {activeId === env.id && <span className="text-xs text-primary">active</span>}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditEnv({ ...env })}><Edit className="h-3 w-3" /></Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-destructive" onClick={() => handleDelete(env.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
        {environments.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No environments yet</p>}
      </div>
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="glass-card border-white/10 max-w-sm">
          <DialogHeader><DialogTitle>Create Environment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Environment name" value={newEnvName} onChange={e => setNewEnvName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()} className="bg-zinc-900 border-zinc-700" />
            <Button onClick={handleCreate} className="w-full btn-send">Create</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!editEnv} onOpenChange={() => setEditEnv(null)}>
        <DialogContent className="glass-card border-white/10 max-w-2xl">
          <DialogHeader><DialogTitle>Edit: {editEnv?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs text-muted-foreground px-1">
              <span className="w-4" /><span>Key</span><span>Value</span><span className="w-8" />
            </div>
            {editEnv?.variables.map((v, idx) => (
              <div key={idx} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                <Checkbox checked={v.enabled} onCheckedChange={val => updateVariable(idx, { enabled: !!val })} className="border-zinc-600" />
                <Input placeholder="Key" value={v.key} onChange={e => updateVariable(idx, { key: e.target.value })} className="h-8 text-sm bg-zinc-900 border-zinc-700 font-mono" />
                <Input placeholder="Value" value={v.value} onChange={e => updateVariable(idx, { value: e.target.value })} className="h-8 text-sm bg-zinc-900 border-zinc-700 font-mono" />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-destructive" onClick={() => removeVariable(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addVariable} className="h-7 text-xs text-muted-foreground"><Plus className="h-3 w-3 mr-1" />Add Variable</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
