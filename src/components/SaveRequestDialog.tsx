import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiRequest, Collection } from "@/types";
import { Save, Plus } from "lucide-react";
import { CreateCollectionDialog } from "./CreateCollectionDialog";

interface SaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ApiRequest;
  collections: Collection[];
  onSaveRequest: (name: string, collectionId: string) => void;
  onCreateCollection: (collection: Omit<Collection, "id" | "createdAt" | "updatedAt">) => Collection;
}

export function SaveRequestDialog({ open, onOpenChange, request, collections, onSaveRequest, onCreateCollection }: SaveRequestDialogProps) {
  const [name, setName] = useState(request.name);
  const [collectionId, setCollectionId] = useState(request.collectionId ?? "");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (open) {
      setName(request.name);
      setCollectionId(request.collectionId ?? (collections.length > 0 ? collections[0].id : ""));
    }
  }, [open, request, collections]);

  const handleSave = () => {
    if (!name.trim() || !collectionId) return;
    onSaveRequest(name.trim(), collectionId);
    onOpenChange(false);
  };

  const handleCreateCollection = (colData: Omit<Collection, "id" | "createdAt" | "updatedAt">) => {
    const newColl = onCreateCollection(colData);
    setCollectionId(newColl.id);
    setShowCreateDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Save className="h-4 w-4 text-primary" />Save Request</DialogTitle>
            <DialogDescription>Save this request to a collection for reuse.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="req-name" className="text-sm">Request Name</Label>
              <Input id="req-name" placeholder="Get User by ID" value={name}
                onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()} autoFocus />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Collection</Label>
                {collections.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCreateDialog(true)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> New Collection
                  </button>
                )}
              </div>
              {collections.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 rounded-lg border border-dashed border-zinc-700 text-center space-y-2">
                  <p>No collections created yet.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateDialog(true)}
                    className="text-xs text-primary border-primary/40 hover:bg-primary/10"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Create Collection
                  </Button>
                </div>
              ) : (
                <Select value={collectionId} onValueChange={setCollectionId}>
                  <SelectTrigger><SelectValue placeholder="Select a collection..." /></SelectTrigger>
                  <SelectContent>
                    {collections.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim() || !collectionId} className="btn-send">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateCollectionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateCollection={handleCreateCollection}
      />
    </>
  );
}
