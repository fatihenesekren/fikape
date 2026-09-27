import { describe, expect, it } from "vitest";
import { cekisTekrarsizEkle } from "./cekisTekrarsizEkle";

describe("cekisTekrarsizEkle", () => {
  it("motor metni çekişi zaten içeriyorsa tekrar eklemez (BMW X1 sDrive16d gibi)", () => {
    expect(cekisTekrarsizEkle("sDrive16d 1.5", "sDrive")).toBe("sDrive16d 1.5");
  });

  it("motor metni çekişi içermiyorsa ekler (BMW X1 sDrive 18i, ayrık yazım)", () => {
    expect(cekisTekrarsizEkle("18i 1.5", "sDrive")).toBe("18i 1.5 sDrive");
  });

  it("çekiş yoksa dokunmaz", () => {
    expect(cekisTekrarsizEkle("1.6 E-Torq", null)).toBe("1.6 E-Torq");
  });

  it("motor yoksa yalnız çekişi döner", () => {
    expect(cekisTekrarsizEkle(null, "quattro")).toBe("quattro");
  });
});
