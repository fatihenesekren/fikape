import { describe, expect, it } from "vitest";
import { yayginSifreMi } from "./yayginSifreler";
import { passwordSchema } from "./schemas";

describe("yayginSifreMi", () => {
  it("karmaşıklık kuralını geçen ama tahmini kolay şifreleri yakalar", () => {
    for (const p of ["Password1!", "Qwerty123!", "Fikape2026!", "Sifre123!", "Galatasaray1905!", "Aaaaaaa1!", "Admin@123", "Merhaba1!"]) {
      expect(yayginSifreMi(p), p).toBe(true);
    }
  });
  it("özgün şifreleri geçirir", () => {
    for (const p of ["Zeytin#Bahcesi47", "k7Q!mxPv2uLw", "Mavi-Deniz_9081x"]) {
      expect(yayginSifreMi(p), p).toBe(false);
    }
  });
});

describe("passwordSchema", () => {
  it("yaygın şifreyi ve 72 baytı aşan (Türkçe karakterli) şifreyi reddeder", () => {
    expect(passwordSchema.safeParse("Password1!").success).toBe(false);
    expect(passwordSchema.safeParse("Zeytin#Bahcesi47").success).toBe(true);
    const uzunTr = "Ğ1a!" + "ş".repeat(36); // 4 + 36 karakter ama 76+ bayt
    expect(uzunTr.length).toBeLessThanOrEqual(72);
    expect(passwordSchema.safeParse(uzunTr).success).toBe(false);
  });
});
