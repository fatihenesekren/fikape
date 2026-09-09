import { describe, it, expect } from "vitest";
import { escapeLike, prepareSearchTerms } from "./searchProducts";

describe("prepareSearchTerms", () => {
  it("2 karakterden kısa sorguyu reddeder", () => {
    expect(prepareSearchTerms("a")).toEqual([]);
    expect(prepareSearchTerms("   ")).toEqual([]);
    expect(prepareSearchTerms("")).toEqual([]);
  });

  it("boşluğa göre kelimelere böler", () => {
    expect(prepareSearchTerms("toyota corolla")).toEqual(["toyota", "corolla"]);
  });

  it("fazla/uçtaki boşlukları yutar", () => {
    expect(prepareSearchTerms("  bmw   320i  ")).toEqual(["bmw", "320i"]);
  });

  it("terim sayısını 6 ile sınırlar", () => {
    expect(prepareSearchTerms("a b c d e f g h i")).toHaveLength(6);
  });

  it("çok uzun sorguyu 128 karaktere kırpar", () => {
    expect(prepareSearchTerms("x".repeat(200))[0]).toHaveLength(128);
  });
});

describe("escapeLike", () => {
  it("% _ \\ kaçırır", () => {
    expect(escapeLike("100%")).toBe("100\\%");
    expect(escapeLike("a_b")).toBe("a\\_b");
    expect(escapeLike("c\\d")).toBe("c\\\\d");
  });

  it("normal metni değiştirmez", () => {
    expect(escapeLike("Toyota Corolla 1.6")).toBe("Toyota Corolla 1.6");
  });
});
