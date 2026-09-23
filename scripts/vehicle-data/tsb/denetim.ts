/**
 * TSB dönüşümü için katmanlı denetim örneklemi üretir.
 * Çalıştır: npx tsx scripts/vehicle-data/tsb/denetim.ts [tohum]
 * Önce build.ts çalışmış olmalı. Çıktı: scripts/vehicle-data/_inceleme/denetim.html
 *
 * Katmanlar, kuralların isabetini AYRI ölçmek için seçildi:
 *   20 rastgele otomobil · 12 rastgele kamyonet
 *   10 "kural-adlandirma" ile benzinli sayılan
 */
import fs from "fs";
import path from "path";
import type { KatalogTip } from "./build";

const dir = path.join(process.cwd(), "scripts", "vehicle-data", "_inceleme");
const { katalog, baslik } = JSON.parse(fs.readFileSync(path.join(dir, "tsb-katalog.json"), "utf8")) as {
  baslik: string;
  katalog: Record<string, Record<string, Record<string, { tipler: KatalogTip[] }>>>;
};

const tum: KatalogTip[] = Object.values(katalog).flatMap((byMake) =>
  Object.values(byMake).flatMap((models) => Object.values(models).flatMap((m) => m.tipler)),
);

let seed = Number(process.argv[2] ?? 20260923);
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const secilen = new Set<KatalogTip>();
function sec(havuz: KatalogTip[], n: number, katman: string) {
  const karisik = havuz.filter((t) => !secilen.has(t)).map((t) => [rnd(), t] as const).sort((a, b) => a[0] - b[0]);
  return karisik.slice(0, n).map(([, t]) => { secilen.add(t); return { katman, t }; });
}

const orneklem = [
  ...sec(tum.filter((t) => t.category === "otomobil"), 20, "Rastgele otomobil"),
  ...sec(tum.filter((t) => t.category === "kamyonet"), 12, "Rastgele kamyonet"),
  ...sec(tum.filter((t) => t.yakitKaynak === "kural-adlandirma"), 10, "Kural: işaretsiz → benzinli"),
];

const YAKIT: Record<string, string> = { GASOLINE: "Benzin", DIESEL: "Dizel", HYBRID: "Hibrit", PHEV: "Plug-in Hibrit", EV: "Elektrik", LPG: "LPG" };
const VITES: Record<string, string> = { MANUAL: "Manuel", AUTOMATIC: "Otomatik" };
const KAYNAK: Record<string, string> = {
  tsb: "TSB'de yazıyor", "kural-model": "model tek yakıtlı", "kural-ev": "elektrikli → otomatik",
  "kural-adlandirma": "işaretsiz → benzinli",
};
const alan = (v: string | number | null, kaynak?: string | null) =>
  v === null || v === undefined ? `<span class="bos">sorulacak</span>` : `${v}${kaynak && kaynak !== "tsb" ? ` <small>(${KAYNAK[kaynak]})</small>` : ""}`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const rows = orneklem.map(({ katman, t }, i) => {
  const yil = t.yillar.length ? `${Math.min(...t.yillar)}–${Math.max(...t.yillar)}` : "";
  return `<article class="satir" data-i="${i + 1}">
  <header><b>${i + 1}</b><span class="katman">${katman}</span></header>
  <div class="ham">TSB: <code>${esc(t.ham)}</code></div>
  <dl>
    <dt>Marka / Model</dt><dd>${esc(t.make)} ${esc(t.model)}${t.nesil ? ` (${t.nesil})` : ""}</dd>
    <dt>Yıllar</dt><dd>${yil}</dd>
    <dt>Versiyon</dt><dd>${alan(t.motor)}${t.hp ? ` · ${t.hp} HP` : ""}${t.cekis ? ` · ${t.cekis}` : ""}</dd>
    <dt>Donanım paketi</dt><dd>${alan(t.paket && esc(t.paket))}</dd>
    <dt>Kasa</dt><dd>${alan(t.kasa && esc(t.kasa))}</dd>
    <dt>Yakıt</dt><dd>${alan(t.yakit && YAKIT[t.yakit], t.yakitKaynak)}</dd>
    <dt>Vites</dt><dd>${alan(t.vites && VITES[t.vites], t.vitesKaynak)}</dd>
  </dl>
  <div class="oy" role="group" aria-label="Satır ${i + 1} değerlendirmesi">
    <button data-v="D">✓ Doğru</button><button data-v="H">✗ Hatalı</button><button data-v="?">Emin değilim</button>
  </div>
  <input class="not" placeholder="Hatalıysa hangi alan? (örn. vites otomatik olmalı)" hidden>
</article>`;
}).join("\n");

const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Katalog Denetimi</title>
<style>
:root{--bg:#f7f7f5;--card:#fff;--ink:#1a1a1a;--mute:#6b6b6b;--line:#e4e2dd;--ok:#1f7a4d;--bad:#b3261e;--unk:#8a6d00;--accent:#1e3a8a}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141414;--card:#1e1e1e;--ink:#eee;--mute:#a0a0a0;--line:#333;--ok:#4cc38a;--bad:#ff8a80;--unk:#e6c14d;--accent:#93b4ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px 140px}
h1{font-size:22px;margin:0 0 4px}p.alt{color:var(--mute);margin:0 0 20px}
.nasil{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:20px}
.nasil li{margin:4px 0}
.satir{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:12px}
.satir header{display:flex;gap:10px;align-items:center;margin-bottom:6px}.satir header b{font-size:16px}
.katman{font-size:12px;color:var(--mute);border:1px solid var(--line);border-radius:99px;padding:1px 8px}
.ham{font-size:13px;color:var(--mute);margin-bottom:8px;overflow-wrap:anywhere}.ham code{color:var(--ink)}
dl{display:grid;grid-template-columns:130px 1fr;gap:3px 12px;margin:0 0 10px}dt{color:var(--mute);font-size:13px}dd{margin:0;min-width:0;overflow-wrap:anywhere}
small{color:var(--mute)}.bos{color:var(--unk);font-style:italic}
.oy{display:flex;gap:8px;flex-wrap:wrap}.oy button{flex:1;min-width:90px;padding:8px;border-radius:8px;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;cursor:pointer}
.oy button.sec[data-v="D"]{background:var(--ok);border-color:var(--ok);color:#fff}.oy button.sec[data-v="H"]{background:var(--bad);border-color:var(--bad);color:#fff}.oy button.sec[data-v="?"]{background:var(--unk);border-color:var(--unk);color:#fff}
.not{width:100%;margin-top:8px;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit}
.alt-bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:12px 16px}
.alt-bar div{max-width:760px;margin:0 auto;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}
#kopyala{padding:10px 16px;border-radius:8px;border:0;background:var(--accent);color:#fff;font:inherit;font-weight:600;cursor:pointer}
</style></head><body><main>
<h1>Katalog denetimi — ${orneklem.length} satır</h1>
<p class="alt">Kaynak: TSB Kasko Değer Listesi, ${esc(baslik)}</p>
<div class="nasil"><b>Nasıl yapılır? (yaklaşık 10 dakika)</b><ul>
<li>Her kartta üstte TSB'nin ham satırı, altta benim ayırdığım alanlar var.</li>
<li>Alanlar ham satırla ve bildiğiniz gerçekle <b>çelişmiyorsa</b> "Doğru" deyiniz.</li>
<li>"<span class="bos">sorulacak</span>" yazan alan hata değildir; formda kullanıcıya sorulacak demektir.</li>
<li>Paket adının yazımı ("Gt-Line" gibi) önemli değil; yanlış alana düşmüş bilgi önemli.</li>
<li>Bitince alttaki düğmeyle sonucu kopyalayıp sohbete yapıştırınız.</li></ul></div>
${rows}
</main>
<div class="alt-bar"><div><span id="sayac">0 / ${orneklem.length} işaretlendi</span><button id="kopyala">Sonucu kopyala</button></div></div>
<script>
const oy={};
document.querySelectorAll('.satir').forEach(s=>{
  const i=s.dataset.i, not=s.querySelector('.not');
  s.querySelectorAll('.oy button').forEach(b=>b.addEventListener('click',()=>{
    s.querySelectorAll('.oy button').forEach(x=>x.classList.remove('sec'));b.classList.add('sec');
    oy[i]=b.dataset.v; not.hidden=b.dataset.v!=='H'; if(!not.hidden) not.focus();
    document.getElementById('sayac').textContent=Object.keys(oy).length+' / ${orneklem.length} işaretlendi';
  }));
});
document.getElementById('kopyala').addEventListener('click',async()=>{
  const d=Object.values(oy).filter(v=>v==='D').length, h=Object.entries(oy).filter(([,v])=>v==='H');
  const u=Object.entries(oy).filter(([,v])=>v==='?').map(([i])=>i);
  const txt='DENETİM SONUCU: '+d+' doğru, '+h.length+' hatalı, '+u.length+' emin değil (toplam ${orneklem.length})\\n'+
    h.map(([i])=>'Hatalı #'+i+': '+(document.querySelector('.satir[data-i="'+i+'"] .not').value||'-')).join('\\n')+
    (u.length?'\\nEmin değil: '+u.join(', '):'');
  try{await navigator.clipboard.writeText(txt);document.getElementById('kopyala').textContent='Kopyalandı ✓'}
  catch{prompt('Bu metni kopyalayınız:',txt)}
});
</script></body></html>`;

fs.writeFileSync(path.join(dir, "denetim.html"), html);
console.log(`✓ ${orneklem.length} satırlık denetim → ${path.relative(process.cwd(), path.join(dir, "denetim.html"))}`);
