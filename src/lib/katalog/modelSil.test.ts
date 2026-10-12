import { describe, expect, it } from "vitest";
import { modelSilSema } from "./urunDogrula";

describe("modelSilSema", () => {
  it("beklenen adı ister, fazladan alanı reddeder", () => {
    expect(modelSilSema.safeParse({ beklenenAd: "Transit" }).success).toBe(true);
    expect(modelSilSema.safeParse({}).success).toBe(false);
    expect(modelSilSema.safeParse({ beklenenAd: "" }).success).toBe(false);
    expect(modelSilSema.safeParse({ beklenenAd: "Transit", zorla: true }).success).toBe(false);
  });
});
