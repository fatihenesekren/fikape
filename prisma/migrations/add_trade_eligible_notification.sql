-- Migration: yeni bildirim tipi TRADE_ELIGIBLE
-- ("Aracınızı artık takasa açabilirsiniz" — yorum fotoğrafı onaylanınca; lib/takasUygunlukBildirimi.ts)
--
-- Supabase SQL Editor'de TEK BAŞINA çalıştırın (enum ADD VALUE: aynı betikte yeni değeri kullanan
-- başka bir ifade olmamalı; geri alınamaz — Postgres enum değeri silmeyi desteklemez, kullanılmayan
-- değer zararsızdır). Kod, değer eklenmeden yayınlansa bile bildirim yalnızca oluşmaz (hata yutulur,
-- uygulama bozulmaz); ayrıca bildirim varsayılan KAPALI (TAKASA_AC_UYGUN_BILDIRIM_ENABLED).

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TRADE_ELIGIBLE';
