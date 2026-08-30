import { Environment } from "@/types";

const STORAGE_KEY = "argasx-environments";
const ACTIVE_ENV_KEY = "argasx-active-env";
const GLOBALS_KEY = "argasx-global-vars";

export class EnvironmentService {
  static getAll(): Environment[] {
    try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
  }
  static save(environments: Environment[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(environments));
  }
  static create(name: string): Environment {
    const envs = this.getAll();
    const env: Environment = { id: crypto.randomUUID(), name, variables: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    envs.push(env); this.save(envs); return env;
  }
  static update(id: string, updates: Partial<Environment>): void {
    const envs = this.getAll(); const idx = envs.findIndex(e => e.id === id);
    if (idx !== -1) { envs[idx] = { ...envs[idx], ...updates, updatedAt: new Date().toISOString() }; this.save(envs); }
  }
  static delete(id: string): void { this.save(this.getAll().filter(e => e.id !== id)); if (this.getActiveId() === id) this.setActiveId(""); }
  static getActiveId(): string { return localStorage.getItem(ACTIVE_ENV_KEY) ?? ""; }
  static setActiveId(id: string): void { localStorage.setItem(ACTIVE_ENV_KEY, id); }
  static getActive(): Environment | null { const id = this.getActiveId(); if (!id) return null; return this.getAll().find(e => e.id === id) ?? null; }
  static getActiveVars(): Record<string, string> {
    const active = this.getActive(); const result: Record<string, string> = {};
    if (!active) return result; active.variables.filter(v => v.enabled).forEach(v => { result[v.key] = v.value; }); return result;
  }
  static getGlobals(): Record<string, string> { try { const d = localStorage.getItem(GLOBALS_KEY); return d ? JSON.parse(d) : {}; } catch { return {}; } }
  static setGlobals(globals: Record<string, string>): void { localStorage.setItem(GLOBALS_KEY, JSON.stringify(globals)); }
  static updateActiveVars(updatedVars: Record<string, string>): void {
    const active = this.getActive(); if (!active) return;
    const vars = active.variables.map(v => ({ ...v, value: updatedVars[v.key] !== undefined ? updatedVars[v.key] : v.value }));
    Object.entries(updatedVars).forEach(([key, value]) => { if (!vars.find(v => v.key === key)) vars.push({ key, value, enabled: true }); });
    this.update(active.id, { variables: vars });
  }
  static resolve(template: string, extraVars: Record<string, string> = {}): string {
    const vars = { ...this.getGlobals(), ...this.getActiveVars(), ...extraVars };
    return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => vars[key.trim()] ?? ("{{" + key + "}}"));
  }
  static resolveRequest<T extends { url: string; headers: any[]; body: string }>(request: T, extraVars: Record<string, string> = {}): T {
    const vars = { ...this.getGlobals(), ...this.getActiveVars(), ...extraVars };
    const resolve = (s: string) => s.replace(/\{\{([^}]+)\}\}/g, (_, k) => vars[k.trim()] ?? ("{{" + k + "}}"));
    return { ...request, url: resolve(request.url), body: resolve(request.body ?? ""), headers: request.headers.map((h: any) => ({ ...h, key: resolve(h.key), value: resolve(h.value) })) };
  }
}
