import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { Button } from "@/components/ui/button";
import { EditorView } from "@codemirror/view";

interface ScriptEditorProps { value: string; onChange: (val: string) => void; type: "pre-request" | "test"; }

const SNIPPETS: Record<string, Array<{label: string; code: string}>> = {
  "pre-request": [
    { label: "Set var", code: 'pm.environment.set("key", "value");' },
    { label: "Get var", code: 'const val = pm.environment.get("key");' },
    { label: "Log", code: 'console.log("message");' },
  ],
  test: [
    { label: "Status 200", code: 'pm.test("Status is 200", () => {\n  pm.expect(pm.response.code).to.equal(200);\n});' },
    { label: "Time < 500ms", code: 'pm.test("Response time OK", () => {\n  pm.expect(pm.response.responseTime).to.be.below(500);\n});' },
    { label: "Has property", code: 'pm.test("Body has id", () => {\n  const json = pm.response.json();\n  pm.expect(json).to.have.property("id");\n});' },
    { label: "Save to env", code: 'const json = pm.response.json();\npm.environment.set("savedId", String(json.id));' },
  ],
};

export function ScriptEditor({ value, onChange, type }: ScriptEditorProps) {
  const snippets = SNIPPETS[type] ?? [];
  const insertSnippet = (code: string) => onChange((value ? value + "\n\n" : "") + code);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Snippets:</span>
        {snippets.map(s => (
          <Button key={s.label} variant="outline" size="sm" className="h-6 text-xs px-2 border-zinc-700 hover:border-zinc-500" onClick={() => insertSnippet(s.code)}>
            {s.label}
          </Button>
        ))}
      </div>
      <div className="rounded overflow-hidden border border-zinc-800">
        <CodeMirror value={value} height="180px" theme={oneDark} extensions={[javascript(), EditorView.lineWrapping]} onChange={onChange} basicSetup={{ lineNumbers: true, foldGutter: false }} />
      </div>
    </div>
  );
}
