import { describe, expect, it } from "vitest";
import { guvenliGorselIndir, GorselIndirmeHatasi, ozelAdresMi } from "./guvenliGorselIndir";

describe("ozelAdresMi", () => {
  it("özel / yerel / metadata aralıklarını yakalar", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fe80::1", "fd00::1", "::ffff:10.0.0.1"]) {
      expect(ozelAdresMi(ip), ip).toBe(true);
    }
  });
  it("genel adreslere izin verir", () => {
    for (const ip of ["8.8.8.8", "93.184.216.34", "172.32.0.1", "2606:4700::1111"]) {
      expect(ozelAdresMi(ip), ip).toBe(false);
    }
  });
});

describe("guvenliGorselIndir — ağa çıkmadan reddedilenler", () => {
  const kod = async (adres: string) => {
    try { await guvenliGorselIndir(adres); return "hata-yok"; } catch (e) { return e instanceof GorselIndirmeHatasi ? e.kod : "baska"; }
  };
  it("iç ağ, localhost, metadata, kimlik bilgili ve yanlış protokol", async () => {
    expect(await kod("http://127.0.0.1/a.png")).toBe("guvensiz-hedef");
    expect(await kod("http://localhost:3000/a.png")).toBe("guvensiz-hedef");
    expect(await kod("http://169.254.169.254/latest/meta-data")).toBe("guvensiz-hedef");
    expect(await kod("http://[::1]/a.png")).toBe("guvensiz-hedef");
    expect(await kod("https://user:pass@example.com/a.png")).toBe("guvensiz-hedef");
    expect(await kod("file:///etc/passwd")).toBe("guvensiz-hedef");
    expect(await kod("not a url")).toBe("gecersiz-adres");
  });
});
