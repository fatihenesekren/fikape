import { describe, it, expect } from "vitest";
import { parseVersion, formatVersionLabel, versionForTrimName } from "./parseVersion";

describe("parseVersion", () => {
  it("HP ortadaysa da bulur (çekiş eki arkada)", () => {
    expect(parseVersion("1.4 Boosterjet 129 AWD", "otomobil")).toEqual({ base: "1.4 Boosterjet AWD", hp: 129 });
    expect(parseVersion("3.0 TFSI 272 quattro", "otomobil")).toEqual({ base: "3.0 TFSI quattro", hp: 272 });
  });

  it("sondaki HP'yi bulur", () => {
    expect(parseVersion("1.4 T-Jet 135", "otomobil")).toEqual({ base: "1.4 T-Jet", hp: 135 });
    expect(parseVersion("1.4 16V 100", "otomobil")).toEqual({ base: "1.4 16V", hp: 100 });
  });

  it("model kodu olan sayıyı korur, yalnız son sayıyı HP sayar", () => {
    expect(parseVersion("C 180 156", "otomobil")).toEqual({ base: "C 180", hp: 156 });
    expect(parseVersion("35 168", "otomobil")).toEqual({ base: "35", hp: 168 });
    expect(parseVersion("AMG S 63 612", "otomobil")).toEqual({ base: "AMG S 63", hp: 612 });
  });

  it("ilk token asla HP değildir", () => {
    expect(parseVersion("595 Competizione 180", "otomobil").base).toBe("595 Competizione");
    expect(parseVersion("595", "otomobil").hp).toBeNull();
  });

  it("Audi/AMG model kodlarını HP sanmaz", () => {
    expect(parseVersion("Sportback 50 quattro", "otomobil").hp).toBeNull();
    expect(parseVersion("AMG C 63 S", "otomobil").hp).toBeNull();
    expect(parseVersion("AMG GT 55 4MATIC+", "otomobil").hp).toBeNull();
    expect(parseVersion("AMG A 45", "otomobil").hp).toBeNull();
  });

  it("CV birimini HP ile birlikte düşürür", () => {
    expect(parseVersion("Elektrik 155 CV 63kWh", "otomobil")).toEqual({ base: "Elektrik 63kWh", hp: 155 });
  });

  it("otomobil/kamyonet dışındaki kategorilere dokunmaz", () => {
    expect(parseVersion("Atlas 24", "karavan")).toEqual({ base: "Atlas 24", hp: null });
    expect(parseVersion("V-Strom 1000", "motosiklet")).toEqual({ base: "V-Strom 1000", hp: null });
  });
});

describe("formatVersionLabel", () => {
  it("HP'yi birimiyle sona alır, çekişi açıklar", () => {
    expect(formatVersionLabel("1.4 Boosterjet 129 AWD", "otomobil")).toBe("1.4 Boosterjet AWD(4x4) · 129 HP");
    expect(formatVersionLabel("Atlas 24", "karavan")).toBe("Atlas 24");
  });
});

describe("versionForTrimName", () => {
  it("HP ve EV rakamlarını temizler", () => {
    expect(versionForTrimName("1.4 Boosterjet 129 AWD", "otomobil")).toBe("1.4 Boosterjet AWD");
    expect(versionForTrimName("Extended Range 204 72.8kWh", "otomobil")).toBe("Extended Range");
    expect(versionForTrimName("Long Range 84.5kW 49kWh", "otomobil")).toBe("Long Range");
  });

  it("e-mobilite birimlerini kendi kategorisinde temizler", () => {
    expect(versionForTrimName("Elektrik 3 kW 72V 35Ah", "motosiklet")).toBe("");
  });
});
