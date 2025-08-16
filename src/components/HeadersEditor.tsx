import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { Header } from "./RequestTab";

interface HeadersEditorProps {
  headers: Header[];
  onChange: (headers: Header[]) => void;
}

export function HeadersEditor({ headers, onChange }: HeadersEditorProps) {
  const addHeader = () => {
    const newHeader: Header = {
      key: '',
      value: '',
      enabled: true
    };
    onChange([...headers, newHeader]);
  };

  const updateHeader = (index: number, updates: Partial<Header>) => {
    const updatedHeaders = headers.map((header, i) =>
      i === index ? { ...header, ...updates } : header
    );
    onChange(updatedHeaders);
  };

  const removeHeader = (index: number) => {
    const updatedHeaders = headers.filter((_, i) => i !== index);
    onChange(updatedHeaders);
  };

  const addCommonHeaders = (key: string, value: string) => {
    const existingIndex = headers.findIndex(h => h.key.toLowerCase() === key.toLowerCase());
    if (existingIndex >= 0) {
      updateHeader(existingIndex, { value, enabled: true });
    } else {
      onChange([...headers, { key, value, enabled: true }]);
    }
  };

  const commonHeaders = [
    { name: 'Content-Type: JSON', key: 'Content-Type', value: 'application/json' },
    { name: 'Content-Type: XML', key: 'Content-Type', value: 'application/xml' },
    { name: 'Authorization: Bearer', key: 'Authorization', value: 'Bearer ' },
    { name: 'User-Agent', key: 'User-Agent', value: 'LightPostman/1.0' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Headers</h3>
        <div className="flex items-center space-x-2">
          <div className="flex flex-wrap gap-1">
            {commonHeaders.map((header) => (
              <Button
                key={header.name}
                variant="ghost"
                size="sm"
                onClick={() => addCommonHeaders(header.key, header.value)}
                className="h-6 text-xs"
              >
                {header.name}
              </Button>
            ))}
          </div>
          <Button
            onClick={addHeader}
            size="sm"
            variant="outline"
            className="h-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {headers.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No headers added yet. Click the + button to add a header.
          </div>
        )}
        
        {headers.map((header, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Checkbox
              checked={header.enabled}
              onCheckedChange={(enabled) => 
                updateHeader(index, { enabled: enabled as boolean })
              }
            />
            <Input
              placeholder="Header name"
              value={header.key}
              onChange={(e) => updateHeader(index, { key: e.target.value })}
              className="flex-1"
            />
            <Input
              placeholder="Header value"
              value={header.value}
              onChange={(e) => updateHeader(index, { value: e.target.value })}
              className="flex-1"
            />
            <Button
              onClick={() => removeHeader(index)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}