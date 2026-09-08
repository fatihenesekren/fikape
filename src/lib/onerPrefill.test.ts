import { describe, it, expect } from "vitest";
import { resolveOnerPrefill } from "./onerPrefill";

describe("resolveOnerPrefill", () => {
  it("boş sorgu → hepsi boş, kategori bile seçili değil", () => {
    expect(resolveOnerPrefill("")).toEqual({
      categorySlug: "",
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

  it("nesil belirsiz (clio → Clio 2/3/4/5) → marka dolu, model BOŞ", () => {
    const r = resolveOnerPrefill("?q=clio");
    expect(r.selectedMake).toBe("Renault");
    expect(r.selectedModel).toBe("");
  });

  it("tek nesil / tam model adı → model de dolar", () => {
    const r = resolveOnerPrefill("?q=twingo");
    expect(r.selectedMake).toBe("Renault");
    expect(r.selectedModel).toMatch(/^Twingo/);
  });

  it("bilinen marka + varyant kelimesi → marka + Diğer model + customModel", () => {
    const r = resolveOnerPrefill("?q=dacia sandero");
    expect(r.selectedMake).toBe("Dacia");
    expect(r.selectedModel).toBe("Diğer");
    expect(r.customModel).toBe("sandero");
  });

  const EMPTY = {
    categorySlug: "",
    selectedMake: "", customMake: "",
    selectedModel: "", customModel: "", notes: "",
  };

  it("katalogda olmayan tek kelime marka (lada) → HİÇBİR ŞEY doldurma", () => {
    expect(resolveOnerPrefill("?q=lada")).toEqual(EMPTY);
  });

  it("anlamsız girdi (sdfg) → HİÇBİR ŞEY doldurma", () => {
    expect(resolveOnerPrefill("?q=sdfg")).toEqual(EMPTY);
  });

  it("hiç eşleşmeyen çok kelimeli sorgu → HİÇBİR ŞEY doldurma", () => {
    expect(resolveOnerPrefill("?q=chery tiggo 7")).toEqual(EMPTY);
  });
});
