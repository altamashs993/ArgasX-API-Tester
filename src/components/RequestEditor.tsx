import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { oneDark } from '@codemirror/theme-one-dark';

interface RequestEditorProps {
  body: string;
  bodyType: 'raw' | 'json' | 'xml';
  onBodyChange: (body: string) => void;
  onBodyTypeChange: (bodyType: 'raw' | 'json' | 'xml') => void;
}

export function RequestEditor({
  body,
  bodyType,
  onBodyChange,
  onBodyTypeChange
}: RequestEditorProps) {
  const getLanguageExtension = () => {
    switch (bodyType) {
      case 'json': return [json()];
      case 'xml': return [xml()];
      default: return [];
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Request Body</h3>
        <Select value={bodyType} onValueChange={onBodyTypeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="raw">Raw</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="xml">XML</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <CodeMirror
          value={body}
          height="200px"
          theme={oneDark}
          extensions={getLanguageExtension()}
          onChange={(value) => onBodyChange(value)}
          placeholder={`Enter ${bodyType.toUpperCase()} content here...`}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: false,
          }}
        />
      </div>
    </div>
  );
}