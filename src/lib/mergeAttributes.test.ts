import { describe, expect, it } from "vitest";
import { mergeAttributes } from "./mergeAttributes";

describe("mergeAttributes", () => {
  it("gelen değerleri mevcut kaydın üzerine yazar, dokunulmayanı korur", () => {
    const m = mergeAttributes({ fuel_type: "EV", power_hp: 100 }, { power_hp: "269", seat_count: "15" });
    expect(m).toEqual({ fuel_type: "EV", power_hp: 269, seat_count: 15 });
  });
  it("null ve boş string gelen anahtarı siler", () => {
    const m = mergeAttributes({ cargo_m3: 11, power_hp: 130, tire_size: "205/60 R16" }, { cargo_m3: null, tire_size: "" });
    expect(m).toEqual({ power_hp: 130 });
  });
  it("boolean false silinmez (Yok ile boş farklı)", () => {
    const m = mergeAttributes({}, { four_wd: "false" });
    expect(m).toEqual({ four_wd: false });
  });
  it("olmayan anahtarı silmeye çalışmak zararsız", () => {
    expect(mergeAttributes({ a_b: 1 }, { zz: null })).toEqual({ a_b: 1 });
  });
  it("geçersiz anahtar adları yok sayılır", () => {
    const m = mergeAttributes({ x: 1 }, { "__proto__": "1", "a b": "2", "ok_key": "3" });
    expect(m).toEqual({ x: 1, ok_key: 3 });
  });
});
