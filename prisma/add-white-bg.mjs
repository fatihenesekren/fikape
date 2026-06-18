import sharp from "sharp";

await sharp("C:/Users/dell/AppData/Local/Temp/xiaomi-scooter.png")
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .png()
  .toFile("C:/Users/dell/AppData/Local/Temp/xiaomi-white.png");

console.log("✓ Beyaz arka plan eklendi: xiaomi-white.png");
