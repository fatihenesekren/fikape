import { describe, it, expect } from "vitest";
import { normalizeSearchTerm } from "./searchLog";

describe("normalizeSearchTerm", () => {
  it("trim + küçük harf (tr) + boşluk sadeleştirme", () => {
    expect(normalizeSearchTerm("  Toyota   COROLLA  ")).toBe("toyota corolla");
  });
  it("Türkçe büyük İ → i (tr locale)", () => {
    expect(normalizeSearchTerm("İZUZU")).toBe("izuzu");
  });
  it("200 karakterle sınırlar", () => {
    expect(normalizeSearchTerm("x".repeat(300))).toHaveLength(200);
  });
  it("boş/tek karakter aynen döner (çağıran taraf 2 alt sınırı uygular)", () => {
    expect(normalizeSearchTerm(" a ")).toBe("a");
  });
});
