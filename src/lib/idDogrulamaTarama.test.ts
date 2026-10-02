import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

// Kimlikler (URL [id] parametreleri) Prisma'ya ham parseInt/Number ile verilmesin: NaN, int32 taşması ve "12abc" gibi
// değerler 500 üretir. Tek kaynak: lib/validateId.ts pozitifTamsayiId.
function routeDosyalari(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? routeDosyalari(p) : e.name === "route.ts" ? [p] : [];
  });
}

describe("API route'larında ham id çözümleme taraması", () => {
  const kok = path.join(process.cwd(), "src", "app", "api");
  const yasak = ["= parseInt(id)", "= Number(id)", "= parseInt(id, 10)", "= parseInt(params.id", "= Number(params.id"];

  it("hiçbir route [id] değerini parseInt/Number ile doğrudan çözmez", () => {
    const ihlaller: string[] = [];
    for (const dosya of routeDosyalari(kok)) {
      fs.readFileSync(dosya, "utf8").split("\n").forEach((satir, i) => {
        if (yasak.some((y) => satir.includes(y))) ihlaller.push(`${path.relative(process.cwd(), dosya)}:${i + 1}`);
      });
    }
    expect(ihlaller).toEqual([]);
  });
});
