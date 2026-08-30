import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collection } from "@/types";
import { FolderPlus } from "lucide-react";

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCollection: (collection: Omit<Collection, "id" | "createdAt" | "updatedAt">) => void;
}

export function CreateCollectionDialog({ open, onOpenChange, onCreateCollection }: CreateCollectionDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateCollection({ name: name.trim(), description: description.trim() });
    setName(""); setDescription(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FolderPlus className="h-4 w-4 text-primary" />New Collection</DialogTitle>
          <DialogDescription>Create a new collection to group your API requests.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="col-name" className="text-sm">Name</Label>
            <Input id="col-name" placeholder="My API Collection" value={name}
              onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="col-desc" className="text-sm text-muted-foreground">Description <span className="text-xs">(optional)</span></Label>
            <Input id="col-desc" placeholder="What is this collection for?" value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim()} className="btn-send">Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
