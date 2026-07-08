import { describe, it, expect } from "vitest";
import { stripModelGenRange, stripGenRangeAnywhere } from "./modelDisplay";

describe("stripModelGenRange", () => {
  it("sondaki kapalı nesil aralığını temizler", () => {
    expect(stripModelGenRange("Golf 6 (2008-2012)")).toBe("Golf 6");
  });

  it("sondaki en dash'li aralığı da temizler", () => {
    expect(stripModelGenRange("Golf 6 (2008–2012)")).toBe("Golf 6");
  });

  it("açık uçlu aralığı temizler", () => {
    expect(stripModelGenRange("Model 3 (2020-)")).toBe("Model 3");
  });

  it("nesil aralığı yoksa değiştirmez", () => {
    expect(stripModelGenRange("Golf 6")).toBe("Golf 6");
  });

  it("ortadaki parantezi kaldırmaz (sadece sonda çalışır)", () => {
    expect(stripModelGenRange("Golf 6 (2008-2012) 1.4 TSI")).toBe("Golf 6 (2008-2012) 1.4 TSI");
  });
});

describe("stripGenRangeAnywhere", () => {
  it("ortadaki nesil aralığını da temizler", () => {
    expect(stripGenRangeAnywhere("Volkswagen Golf 6 (2008-2012) 1.4 TSI 2011")).toBe(
      "Volkswagen Golf 6 1.4 TSI 2011"
    );
  });

  it("sondaki aralığı temizler", () => {
    expect(stripGenRangeAnywhere("Golf 6 (2008-2012)")).toBe("Golf 6");
  });

  it("nesil aralığı yoksa değiştirmez", () => {
    expect(stripGenRangeAnywhere("Citroën C5 Aircross")).toBe("Citroën C5 Aircross");
  });
});
