import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload } from "lucide-react";

export interface FormField {
  key: string;
  value: string;
  type: 'text' | 'file';
  enabled: boolean;
  file?: File;
}

interface FormDataEditorProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export function FormDataEditor({ fields, onChange }: FormDataEditorProps) {
  const addField = () => {
    const newField: FormField = {
      key: '',
      value: '',
      type: 'text',
      enabled: true
    };
    onChange([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = fields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    onChange(updatedFields);
  };

  const removeField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    onChange(updatedFields);
  };

  const handleFileSelect = (index: number, file: File | null) => {
    if (file) {
      updateField(index, { 
        file, 
        value: file.name,
        type: 'file' 
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Form Data</h3>
        <Button
          onClick={addField}
          size="sm"
          variant="outline"
          className="h-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {fields.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No form fields added yet. Click the + button to add a field.
          </div>
        )}
        
        {fields.map((field, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Checkbox
              checked={field.enabled}
              onCheckedChange={(enabled) => 
                updateField(index, { enabled: enabled as boolean })
              }
            />
            <Input
              placeholder="Field name"
              value={field.key}
              onChange={(e) => updateField(index, { key: e.target.value })}
              className="flex-1"
            />
            <Select
              value={field.type}
              onValueChange={(type: 'text' | 'file') => updateField(index, { type })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="file">File</SelectItem>
              </SelectContent>
            </Select>
            {field.type === 'text' ? (
              <Input
                placeholder="Field value"
                value={field.value}
                onChange={(e) => updateField(index, { value: e.target.value })}
                className="flex-1"
              />
            ) : (
              <div className="flex-1 flex items-center space-x-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                  className="hidden"
                  id={`file-${index}`}
                />
                <label
                  htmlFor={`file-${index}`}
                  className="flex-1 flex items-center justify-center h-10 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {field.file ? field.file.name : "Choose file"}
                </label>
              </div>
            )}
            <Button
              onClick={() => removeField(index)}
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