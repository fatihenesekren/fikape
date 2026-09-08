import { describe, it, expect } from "vitest";
import { resolveOnerPrefill } from "./onerPrefill";

describe("resolveOnerPrefill", () => {
  it("boş sorgu → varsayılan (otomobil, hepsi boş)", () => {
    expect(resolveOnerPrefill("")).toEqual({
      categorySlug: "otomobil",
      selectedMake: "", customMake: "",
      selectedModel: "", customModel: "", notes: "",
    });
  });

  it("tam marka eşleşmesi → kategori + marka", () => {
    const r = resolveOnerPrefill("?q=renault");
    expect(r.categorySlug).toBe("otomobil");
    expect(r.selectedMake).toBe("Renault");
    expect(r.selectedModel).toBe("");
  });

  it("marka eşleşmesi aksan-duyarsız (CITROEN → Citroën)", () => {
    expect(resolveOnerPrefill("?q=CITROEN").selectedMake).toBe("Citroën");
  });

  it("eski ?brandName= parametresi de kabul edilir", () => {
    expect(resolveOnerPrefill("?brandName=tesla").selectedMake).toBe("Tesla");
  });

  it("model eşleşmesi → kategori + marka + model", () => {
    const r = resolveOnerPrefill("?q=clio");
    expect(r.selectedMake).toBe("Renault");
    expect(r.selectedModel).toMatch(/^Clio/);
  });

  it("katalogda olmayan tek kelime → Diğer / Bulamadım + customMake", () => {
    const r = resolveOnerPrefill("?q=skywell");
    expect(r.selectedMake).toBe("Diğer / Bulamadım");
    expect(r.customMake).toBe("skywell");
  });

  it("bilinen marka + ek kelime → marka + Diğer model + customModel", () => {
    const r = resolveOnerPrefill("?q=dacia sandero");
    expect(r.selectedMake).toBe("Dacia");
    expect(r.selectedModel).toBe("Diğer");
    expect(r.customModel).toBe("sandero");
  });

  it("hiç eşleşmeyen çok kelimeli sorgu → nota ipucu, alanlar boş", () => {
    const r = resolveOnerPrefill("?q=chery tiggo 7");
    expect(r.selectedMake).toBe("");
    expect(r.notes).toBe("Aramada arandı: chery tiggo 7");
  });

  it("60 karakterden uzun sorgu kırpılır", () => {
    const long = "x".repeat(80);
    const r = resolveOnerPrefill(`?q=${long}`);
    // tek kelime ama 24 karakterden uzun → nota düşer, kırpılmış haliyle
    expect(r.notes).toBe(`Aramada arandı: ${"x".repeat(60)}`);
  });
});
