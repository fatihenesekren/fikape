# Operasyon Notları

## Veritabanı — tek Supabase Postgres instance

Ayrı dev/staging veritabanı yok, tek üretim DB'si var (Supabase). Bu iki şeyi etkiler: migration akışı ve yedekleme.

### Migration akışı

`prisma migrate dev` bu projede **kullanılmaz**:
- Pooler bağlantısı (port 6543, pgbouncer) "prepared statement already exists" hatası veriyor.
- Ayrı bir dev DB olmadığından `migrate dev` doğrudan üretime dokunur.

Doğru akış:
1. `prisma/schema.prisma`'yı düzenle.
2. SQL üret: `DATABASE_URL="$DIRECT_URL" npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` (DIRECT_URL = port 5432, pooler değil).
3. Çıktıyı elle gözden geçir — ilgisiz drift'leri (bkz. aşağıdaki bilinen drift) SQL dosyasına dahil etme.
4. Sadece hedeflenen değişikliği `prisma/migrations/<açıklayıcı-isim>.sql` olarak kaydet (tarihli klasör değil, düz `.sql` dosyası — bu projenin pattern'i).
5. SQL'i **Supabase Dashboard → SQL Editor**'den elle çalıştır. Otomatik/interaktif migration komutu üretime karşı hiç çalıştırılmaz.
6. Uyguladıktan sonra `npx prisma generate` ile client'ı güncelle.

**Bilinen drift:** `prisma migrate diff` çalıştırıldığında `vehicle_suggestions` tablosunda ilgisiz bir enum/FK drop-recreate ve birkaç DateTime tip farkı çıkıyor. Henüz kök nedeni araştırılmadı — yeni migration SQL'i hazırlarken bu kısmı her seferinde elle çıkar.

### Yedekleme / felaket kurtarma

Kod tarafından doğrulanamaz — Supabase Dashboard'dan kontrol edilmesi gerekiyor:

- **Dashboard → Database → Backups**: Point-in-Time Recovery (PITR) açık mı, kaç günlük pencere var? Free/Pro plan farkına göre değişir.
- PITR yoksa en azından günlük otomatik backup'ın aktif olduğunu doğrula.
- Kritik bir migration'dan (özellikle `DROP COLUMN`/`DROP TABLE` içerenlerden) önce manuel bir backup/snapshot almayı alışkanlık haline getir.
- Bu projede şu ana kadar hiç `DROP` içeren bir migration SQL'i yazılmadı (sadece `ADD COLUMN`/`CREATE TABLE`/`CREATE INDEX`) — bu bilinçli bir tercih, geri dönüşü olmayan şema değişikliklerinden kaçınılıyor.

## Ortamlar

Prod: Vercel + Supabase, tek ortam. `main` branch'e her push otomatik deploy tetikler.
