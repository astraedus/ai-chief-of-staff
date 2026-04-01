import { describe, it, expect } from "vitest";

// Re-implement parseJSON from triage.ts for isolated testing
function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

describe("parseJSON", () => {
  it("parses plain JSON", () => {
    const result = parseJSON<{ name: string }>('{"name": "test"}');
    expect(result.name).toBe("test");
  });

  it("parses JSON wrapped in code fences", () => {
    const input = '```json\n{"name": "test"}\n```';
    const result = parseJSON<{ name: string }>(input);
    expect(result.name).toBe("test");
  });

  it("parses JSON wrapped in plain code fences (no language)", () => {
    const input = '```\n{"count": 42}\n```';
    const result = parseJSON<{ count: number }>(input);
    expect(result.count).toBe(42);
  });

  it("handles extra whitespace around fences", () => {
    const input = '```json  \n  {"value": true}  \n```  ';
    const result = parseJSON<{ value: boolean }>(input);
    expect(result.value).toBe(true);
  });

  it("parses a JSON array", () => {
    const input = '[{"id": 1}, {"id": 2}]';
    const result = parseJSON<{ id: number }[]>(input);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
  });

  it("parses a JSON array in code fences", () => {
    const input = '```json\n[{"id": 1}, {"id": 2}]\n```';
    const result = parseJSON<{ id: number }[]>(input);
    expect(result).toHaveLength(2);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseJSON("{invalid}")).toThrow();
  });

  it("throws on empty string", () => {
    expect(() => parseJSON("")).toThrow();
  });

  it("handles nested objects", () => {
    const input = '{"security": {"is_threat": true, "threat_type": "phishing"}}';
    const result = parseJSON<{ security: { is_threat: boolean; threat_type: string } }>(input);
    expect(result.security.is_threat).toBe(true);
    expect(result.security.threat_type).toBe("phishing");
  });
});
