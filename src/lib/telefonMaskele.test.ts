import { describe, expect, it } from "vitest";
import { telefonMaskele } from "./telefonMaskele";

describe("telefonMaskele", () => {
  it("ilk 4 ve son 2 rakamı bırakır", () => {
    expect(telefonMaskele("05551112233")).toBe("0555 *** ** 33");
    expect(telefonMaskele("0555 111 22 33")).toBe("0555 *** ** 33");
    expect(telefonMaskele("+90 555 111 22 33")).toBe("9055 *** ** 33");
  });
  it("tam numara çıktıda asla bulunmaz", () => {
    const m = telefonMaskele("05067995520");
    expect(m).not.toContain("067995");
    expect(m.replace(/\D/g, "").length).toBe(6);
  });
  it("kısa veya bozuk değer tamamen maskelenir", () => {
    expect(telefonMaskele("123")).toBe("••••••••");
    expect(telefonMaskele("")).toBe("••••••••");
  });
});
