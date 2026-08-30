/**
 * Automated Verification & Regression Test Suite for ArgasX API Tester
 * Tests all core modules: StorageService, ScriptRunner, EnvironmentService, CollectionRunner
 */

// Mock localStorage for Node environment if missing
if (typeof localStorage === "undefined" || localStorage === null) {
  const store: Record<string, string> = {};
  global.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    length: 0,
    key: (i: number) => Object.keys(store)[i] ?? null,
  } as any;
}

import { StorageService } from "../src/services/storageService";
import { EnvironmentService } from "../src/services/environmentService";
import { ScriptRunner } from "../src/services/scriptRunner";
import { CollectionRunner } from "../src/services/collectionRunner";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASSED: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAILED: ${testName} ${detail ? "- " + detail : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  ARGASX AUTOMATED COMPREHENSIVE MODULE TEST SUITE");
  console.log("=======================================================\n");

  // --- MODULE 1: STORAGE SERVICE & COLLECTION SANITIZATION ---
  console.log("[1] Testing StorageService Collections & Sanitization...");
  localStorage.clear();

  const c1 = StorageService.createCollection({ name: "Test Collection 1", description: "Desc 1" });
  assert(typeof c1.name === "string" && c1.name === "Test Collection 1", "Create collection with string name");

  // Test object parameter signature resilience (the bug fix)
  const c2 = StorageService.createCollection({ name: { name: "Object Passed Name", description: "Sub" } } as any);
  assert(typeof c2.name === "string" && c2.name === "Object Passed Name", "Create collection object signature resilience");

  const collections = StorageService.getCollections();
  assert(collections.length === 2, "Get collections count");
  assert(typeof collections[0].name === "string" && typeof collections[1].name === "string", "All collection names sanitized to string");

  // Delete collection
  StorageService.deleteCollection(c1.id);
  assert(StorageService.getCollections().length === 1, "Delete collection");

  // --- MODULE 2: STORAGE SERVICE REQUESTS & HISTORY ---
  console.log("\n[2] Testing StorageService Requests & History...");
  const req1 = StorageService.saveRequest({
    name: "Get Users",
    method: "GET",
    url: "https://api.example.com/users",
    headers: [{ key: "Accept", value: "application/json", enabled: true }],
    body: "",
    bodyType: "raw",
    collectionId: c2.id,
  });
  assert(req1.id.length > 0, "Save request to collection");

  const byCol = StorageService.getRequestsByCollection(c2.id);
  assert(byCol.length === 1 && byCol[0].id === req1.id, "Get requests by collection ID");

  StorageService.addToHistory({
    requestId: req1.id,
    method: req1.method,
    url: req1.url,
    status: 200,
    request: req1,
    isFavorite: false
  });
  const hist = StorageService.getHistory();
  assert(hist.length === 1 && hist[0].url === "https://api.example.com/users", "Add to request history");

  StorageService.deleteHistoryItem(hist[0].id);
  assert(StorageService.getHistory().length === 0, "Delete history item");

  // --- MODULE 3: ENVIRONMENT SERVICE & VARIABLE RESOLUTION ---
  console.log("\n[3] Testing EnvironmentService & Template Interpolation...");
  localStorage.clear();
  const env = EnvironmentService.create("Staging Env");
  EnvironmentService.update(env.id, {
    variables: [
      { key: "BASE_URL", value: "https://staging.api.com", enabled: true },
      { key: "API_KEY", value: "secret-token-123", enabled: true },
      { key: "DISABLED_VAR", value: "should-not-resolve", enabled: false },
    ]
  });
  EnvironmentService.setActiveId(env.id);

  const resolvedUrl = EnvironmentService.resolve("{{BASE_URL}}/v1/data?key={{API_KEY}}");
  assert(resolvedUrl === "https://staging.api.com/v1/data?key=secret-token-123", "Resolve environment variables in URL");

  const unresolvedDisabled = EnvironmentService.resolve("{{DISABLED_VAR}}");
  assert(unresolvedDisabled === "{{DISABLED_VAR}}", "Disabled variables not resolved");

  // --- MODULE 4: SCRIPT RUNNER & POSTMAN PM API ---
  console.log("\n[4] Testing ScriptRunner JS Sandbox & pm API...");
  const scriptCode = `
    pm.test("Status code is 200", () => {
      pm.expect(pm.response.code).to.equal(200);
    });
    pm.test("Response time < 500ms", () => {
      pm.expect(pm.response.responseTime).to.be.below(500);
    });
    const data = pm.response.json();
    pm.environment.set("CREATED_ID", String(data.id));
  `;

  const mockResponse = {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    data: JSON.stringify({ id: 999, name: "ArgasX" }),
    time: 150,
    size: 100
  };

  const scriptRes = ScriptRunner.run(scriptCode, mockResponse, { BASE_URL: "https://staging.api.com" });
  assert(scriptRes.testResults.length === 2, "Test count");
  assert(scriptRes.testResults.every(t => t.passed), "All assertions passed");
  assert(scriptRes.updatedEnv["CREATED_ID"] === "999", "Script set environment variable");

  // --- MODULE 5: COLLECTION RUNNER ---
  console.log("\n[5] Testing CollectionRunner Sequential Execution...");
  const testRequests = [
    {
      id: "req-1",
      name: "Step 1",
      method: "GET",
      url: "https://httpbin.org/get",
      headers: [],
      body: "",
      bodyType: "raw" as const,
      testScript: 'pm.test("Step 1 OK", () => { pm.expect(pm.response.code).to.be.above(0); });'
    }
  ];

  const runnerResults = await CollectionRunner.run(testRequests, { delayMs: 0 });
  assert(runnerResults.length === 1, "Collection runner executed request");
  assert(runnerResults[0].passed === 1, "Collection runner executed test assertion");

  console.log("\n=======================================================");
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});
