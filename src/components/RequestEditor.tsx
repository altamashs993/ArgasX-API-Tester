import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { FormDataEditor, FormField } from './FormDataEditor';

interface RequestEditorProps {
  body: string;
  bodyType: 'form-data' | 'raw';
  rawFormat?: 'text' | 'json' | 'xml' | 'html' | 'javascript';
  formData?: FormField[];
  onBodyChange: (body: string) => void;
  onBodyTypeChange: (bodyType: 'form-data' | 'raw') => void;
  onRawFormatChange?: (format: 'text' | 'json' | 'xml' | 'html' | 'javascript') => void;
  onFormDataChange?: (formData: FormField[]) => void;
}

export function RequestEditor({
  body,
  bodyType,
  rawFormat = 'text',
  formData = [],
  onBodyChange,
  onBodyTypeChange,
  onRawFormatChange,
  onFormDataChange
}: RequestEditorProps) {
  const getLanguageExtension = () => {
    if (bodyType !== 'raw') return [];
    
    switch (rawFormat) {
      case 'json': return [json()];
      case 'xml': return [xml()];
      case 'html': return [html()];
      case 'javascript': return [javascript()];
      default: return [];
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Request Body</h3>
        <div className="flex items-center space-x-2">
          <Select value={bodyType} onValueChange={onBodyTypeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="form-data">Form Data</SelectItem>
              <SelectItem value="raw">Raw</SelectItem>
            </SelectContent>
          </Select>
          {bodyType === 'raw' && onRawFormatChange && (
            <Select value={rawFormat} onValueChange={onRawFormatChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {bodyType === 'form-data' ? (
        <FormDataEditor
          fields={formData}
          onChange={onFormDataChange || (() => {})}
        />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <CodeMirror
            value={body}
            height="200px"
            theme={oneDark}
            extensions={getLanguageExtension()}
            onChange={(value) => onBodyChange(value)}
            placeholder={`Enter ${rawFormat?.toUpperCase() || 'TEXT'} content here...`}
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
      )}
    </div>
  );
}