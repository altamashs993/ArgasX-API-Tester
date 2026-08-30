import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "@/types";
import { StorageService } from "@/services/storageService";
import { Plus, Minus } from "lucide-react";

interface SettingsDialogProps { open: boolean; onOpenChange: (open: boolean) => void; }

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState<Settings>({ httpVersion: "HTTP/1.x", maxResponseSize: 50, theme: "dark" });

  useEffect(() => { if (open) setSettings(StorageService.getSettings()); }, [open]);

  const handleSave = () => { StorageService.saveSettings(settings); onOpenChange(false); };

  const incrementSize = (delta: number) => {
    setSettings(prev => ({
      ...prev,
      maxResponseSize: Math.max(1, (prev.maxResponseSize || 50) + delta)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure ArgasX preferences.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* HTTP Settings */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">HTTP</Label>
            <div className="space-y-2">
              <Label htmlFor="http-version" className="text-sm text-muted-foreground">HTTP Version</Label>
              <Select value={settings.httpVersion} onValueChange={(v: "HTTP/1.x" | "HTTP/2") => setSettings(p => ({ ...p, httpVersion: v }))}>
                <SelectTrigger id="http-version"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HTTP/1.x">HTTP/1.x</SelectItem>
                  <SelectItem value="HTTP/2">HTTP/2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Response Settings */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Response</Label>
            <div className="space-y-2">
              <Label htmlFor="max-size" className="text-sm text-muted-foreground">Max Response Size (MB)</Label>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => incrementSize(-1)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Input
                  id="max-size"
                  type="number"
                  min="1"
                  step="1"
                  value={settings.maxResponseSize}
                  onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setSettings(p => ({ ...p, maxResponseSize: v })); }}
                  className="text-center font-mono"
                  placeholder="50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => incrementSize(1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="btn-send">Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
