import { ApiRequest, ApiResponse } from "@/types";
import { HttpService } from "./httpService";
import { ScriptRunner, TestResult } from "./scriptRunner";
import { EnvironmentService } from "./environmentService";

export interface RunnerRequestResult {
  requestId: string; requestName: string; method: string; url: string;
  status: number; statusText: string; duration: number;
  testResults: TestResult[]; logs: string[]; passed: number; failed: number; error?: string;
}
export interface RunnerOptions { delayMs?: number; dataRows?: Record<string, string>[]; stopOnFailure?: boolean; }
export type RunnerProgressCallback = (result: RunnerRequestResult, index: number, total: number) => void;

function interpolateRow(requests: ApiRequest[], row: Record<string, string>): ApiRequest[] {
  const resolve = (s: string) => s.replace(/\{\{([^}]+)\}\}/g, (_, k) => row[k.trim()] ?? ("{{" + k + "}}"));
  return requests.map(req => ({ ...req, url: resolve(req.url), body: resolve(req.body ?? ""), headers: req.headers.map(h => ({ ...h, key: resolve(h.key), value: resolve(h.value) })) }));
}

export class CollectionRunner {
  static async run(requests: ApiRequest[], options: RunnerOptions = {}, onProgress?: RunnerProgressCallback): Promise<RunnerRequestResult[]> {
    const { delayMs = 0, dataRows, stopOnFailure = false } = options;
    const allResults: RunnerRequestResult[] = [];
    const iterations = dataRows && dataRows.length > 0 ? dataRows : [{}];
    for (const row of iterations) {
      const iterRequests = Object.keys(row).length > 0 ? interpolateRow(requests, row) : requests;
      let envVars = EnvironmentService.getActiveVars();
      for (let i = 0; i < iterRequests.length; i++) {
        const req = EnvironmentService.resolveRequest(iterRequests[i], envVars);
        if (req.preRequestScript) { const pre = ScriptRunner.run(req.preRequestScript, null, envVars); envVars = { ...envVars, ...pre.updatedEnv }; }
        let response: ApiResponse; let error: string | undefined; const start = Date.now();
        try { response = await HttpService.sendRequest(EnvironmentService.resolveRequest(req, envVars)); }
        catch (e) { error = e instanceof Error ? e.message : String(e); response = { status: 0, statusText: "Error", headers: {}, data: error ?? "", time: Date.now() - start, size: 0 }; }
        let testResults: TestResult[] = []; let logs: string[] = [];
        if (req.testScript) { const post = ScriptRunner.run(req.testScript, response, envVars); testResults = post.testResults; logs = post.logs; envVars = { ...envVars, ...post.updatedEnv }; }
        const passed = testResults.filter(t => t.passed).length;
        const failed = testResults.filter(t => !t.passed).length;
        const result: RunnerRequestResult = { requestId: req.id, requestName: req.name, method: req.method, url: req.url, status: response.status, statusText: response.statusText, duration: response.time, testResults, logs, passed, failed, error };
        allResults.push(result); onProgress?.(result, i, iterRequests.length);
        EnvironmentService.updateActiveVars(envVars);
        if (stopOnFailure && failed > 0) break;
        if (delayMs > 0 && i < iterRequests.length - 1) await new Promise(r => setTimeout(r, delayMs));
      }
    }
    return allResults;
  }
}
