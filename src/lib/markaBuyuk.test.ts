import { describe, expect, it } from "vitest";
import { markaBuyuk } from "./markaBuyuk";

describe("markaBuyuk", () => {
  it("yabancı markalar İngilizce kurallarla büyütülür (i → I, İ çıkmaz)", () => {
    expect(markaBuyuk("Giant")).toBe("GIANT");
    expect(markaBuyuk("Inmotion")).toBe("INMOTION");
    expect(markaBuyuk("Specialized")).toBe("SPECIALIZED");
    expect(markaBuyuk("Riese & Müller")).toBe("RIESE & MÜLLER");
  });
  it("yerli markalar Türkçe kurallarla büyütülür (i → İ, ı → I)", () => {
    expect(markaBuyuk("Bisan", true)).toBe("BİSAN");
    expect(markaBuyuk("Karsan ıı", true)).toBe("KARSAN II");
  });
});
