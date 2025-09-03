import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collection, ApiRequest } from '@/types';
import { FolderPlus } from 'lucide-react';

interface SaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ApiRequest;
  collections: Collection[];
  onSaveRequest: (name: string, collectionId: string) => void;
  onCreateCollection: () => void;
}

export function SaveRequestDialog({
  open,
  onOpenChange,
  request,
  collections,
  onSaveRequest,
  onCreateCollection
}: SaveRequestDialogProps) {
  const [name, setName] = useState(request.name || '');
  const [selectedCollection, setSelectedCollection] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCollection) return;

    onSaveRequest(name.trim(), selectedCollection);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setName(request.name || '');
    setSelectedCollection('');
    onOpenChange(false);
  };

  React.useEffect(() => {
    if (open) {
      setName(request.name || '');
      setSelectedCollection('');
    }
  }, [open, request.name]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Save Request</DialogTitle>
            <DialogDescription>
              Choose a name and collection for your API request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="request-name">Request Name</Label>
              <Input
                id="request-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter request name"
                required
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              {collections.length === 0 ? (
                <div className="space-y-2">
                  <div className="p-4 border border-dashed border-border rounded-lg text-center">
                    <FolderPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      No collections available
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onCreateCollection}
                    >
                      Create Collection
                    </Button>
                  </div>
                </div>
              ) : (
                <Select value={selectedCollection} onValueChange={setSelectedCollection} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {collections.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCreateCollection}
                  className="w-full"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create New Collection
                </Button>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || !selectedCollection || collections.length === 0}
            >
              Save Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}