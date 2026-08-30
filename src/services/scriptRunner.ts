import { ApiResponse } from '@/types';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface ScriptRunResult {
  testResults: TestResult[];
  logs: string[];
  updatedEnv: Record<string, string>;
  error?: string;
}

function buildPmObject(
  response: ApiResponse | null,
  envVars: Record<string, string>,
  collectedTests: TestResult[],
  logs: string[]
) {
  const expectFn = (actual: any) => ({
    to: {
      equal: (expected: any) => {
        if (actual !== expected) throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
      },
      eql: (expected: any) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected))
          throw new Error(`Expected deep equality`);
      },
      include: (expected: any) => {
        if (typeof actual === 'string' && !actual.includes(expected))
          throw new Error(`Expected "${actual}" to include "${expected}"`);
        if (Array.isArray(actual) && !actual.includes(expected))
          throw new Error(`Expected array to include ${JSON.stringify(expected)}`);
      },
      be: {
        a: (type: string) => {
          if (typeof actual !== type) throw new Error(`Expected typeof ${JSON.stringify(actual)} to be "${type}"`);
        },
        above: (n: number) => {
          if (!(actual > n)) throw new Error(`Expected ${actual} to be above ${n}`);
        },
        below: (n: number) => {
          if (!(actual < n)) throw new Error(`Expected ${actual} to be below ${n}`);
        },
        ok: () => {
          if (!actual) throw new Error(`Expected value to be truthy`);
        }
      },
      have: {
        property: (key: string) => {
          if (typeof actual !== 'object' || !(key in actual))
            throw new Error(`Expected object to have property "${key}"`);
        },
        length: (len: number) => {
          if (!actual || actual.length !== len)
            throw new Error(`Expected length ${actual?.length} to equal ${len}`);
        }
      }
    }
  });

  return {
    environment: {
      set: (key: string, val: string) => { envVars[key] = String(val); },
      get: (key: string) => envVars[key] ?? '',
      unset: (key: string) => { delete envVars[key]; },
    },
    variables: {
      set: (key: string, val: string) => { envVars[key] = String(val); },
      get: (key: string) => envVars[key] ?? '',
    },
    response: response ? {
      code: response.status,
      status: response.statusText,
      responseTime: response.time,
      headers: { get: (k: string) => response.headers[k] ?? '' },
      json: () => { try { return JSON.parse(response.data); } catch { return {}; } },
      text: () => response.data,
      to: { have: { status: (code: number) => { if (response.status !== code) throw new Error(`Expected status ${response.status} to equal ${code}`); } } }
    } : null,
    test: (name: string, fn: () => void) => {
      try { fn(); collectedTests.push({ name, passed: true }); }
      catch (err) { collectedTests.push({ name, passed: false, error: err instanceof Error ? err.message : String(err) }); }
    },
    expect: expectFn,
  };
}

export class ScriptRunner {
  static run(code: string, response: ApiResponse | null, envVars: Record<string, string>): ScriptRunResult {
    const testResults: TestResult[] = [];
    const logs: string[] = [];
    const updatedEnv = { ...envVars };
    if (!code || code.trim() === '') return { testResults, logs, updatedEnv };
    const pm = buildPmObject(response, updatedEnv, testResults, logs);
    const console_ = {
      log: (...args: any[]) => logs.push(args.map(String).join(' ')),
      warn: (...args: any[]) => logs.push('[warn] ' + args.map(String).join(' ')),
      error: (...args: any[]) => logs.push('[error] ' + args.map(String).join(' ')),
    };
    try {
      // eslint-disable-next-line no-new-func
      new Function('pm', 'console', code)(pm, console_);
    } catch (err) {
      return { testResults, logs, updatedEnv, error: err instanceof Error ? err.message : String(err) };
    }
    return { testResults, logs, updatedEnv };
  }
}
