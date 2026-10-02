import { describe, expect, it } from "vitest";
import { INT32_MAX, pozitifTamsayiId } from "./validateId";

describe("pozitifTamsayiId", () => {
  it.each([[1, 1], ["12", 12], [12.0, 12], [INT32_MAX, INT32_MAX], [String(INT32_MAX), INT32_MAX]])("geçerli: %s", (girdi, beklenen) => {
    expect(pozitifTamsayiId(girdi)).toBe(beklenen);
  });
  it.each([0, -5, 1.5, NaN, Infinity, INT32_MAX + 1, 99999999999999, "abc", "12abc", " 12", "12 ", "", "+12", "1e3", "012", "0x10", "12.0", "99999999999", [], {}, [12], true, false, null, undefined])("geçersiz: %j", (girdi) => {
    expect(pozitifTamsayiId(girdi)).toBeNull();
  });
});
