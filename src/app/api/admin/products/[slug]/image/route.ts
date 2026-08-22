import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { resizeImageBuffer, fetchAndResizeImage } from "@/lib/imageResize";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session || Number(session.user.trustLevel) < 5) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }

    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Dosya gerekli." }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "JPG, PNG veya WebP yükleyiniz." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Dosya 5MB'dan küçük olmalı." }, { status: 400 });
    }

    // Kaynağında küçültme — orijinal çözünürlükte saklamak yerine (bkz. kart.png
    // render'ını 12.8MB'lık bir katalog fotoğrafının çökertmesi) DB'ye hep
    // önceden küçültülmüş/sıkıştırılmış hali kaydediliyor. Böylece hem sayfa
    // performansı hem paylaşım kartı bu sınıf sorundan tamamen bağımsız kalıyor.
    let resized;
    try {
      resized = await resizeImageBuffer(Buffer.from(await file.arrayBuffer()));
    } catch {
      return NextResponse.json({ error: "Görsel işlenemedi — dosya bozuk olabilir." }, { status: 400 });
    }

    const blob = await put(`product-images/${slug}.jpg`, resized.buffer, {
      access: "public",
      contentType: resized.contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    // Blob dosya adı sabit (allowOverwrite) olduğu için aynı URL'yi CDN/tarayıcı
    // önbellekleri (Cache-Control: public, max-age=30 gün) eski baytlarla
    // tutmaya devam ediyordu — bir görsel değiştirildiğinde katalogdaki bazı
    // sayfalar yeni fotoğrafı, bazıları hâlâ eskisini gösteriyordu (bkz.
    // kullanıcı geri bildirimi: "Yamaha XMAX 250'de 2 farklı resim gözüküyor").
    // ?v= sürüm parametresi DB'ye kaydedilen URL'yi HER yüklemede tekilleştirir,
    // böylece önbellekler asla eski görseli sunmaz — "son yüklenen" garanti olur.
    const versionedUrl = `${blob.url}?v=${Date.now()}`;

    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl: versionedUrl },
    });

    return NextResponse.json({ ok: true, imageUrl: versionedUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// URL'den direkt güncelleme (paste workflow)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session || Number(session.user.trustLevel) < 5) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }

    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });
    }

    let body: { imageUrl?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
    }

    const { imageUrl } = body;

    if (!imageUrl || !imageUrl.startsWith("http")) {
      return NextResponse.json({ error: "Geçerli bir URL giriniz." }, { status: 400 });
    }

    // Dış URL'yi doğrudan kaydetmiyoruz — indirip küçültüp KENDİ blob'umuza
    // yüklüyoruz (POST/dosya-yükleme yoluyla aynı işlem). Böylece hem boyut
    // hep bizim kontrolümüzde oluyor (bkz. 12.8MB'lık katalog fotoğrafı
    // kart.png render'ını çökertmişti) hem de kaynak site erişilemez hale
    // gelse bile görsel canlı kalıyor.
    const resized = await fetchAndResizeImage(imageUrl);
    if (!resized) {
      return NextResponse.json(
        { error: "Görsel indirilemedi veya işlenemedi — URL'i kontrol ediniz." },
        { status: 400 }
      );
    }

    const blob = await put(`product-images/${slug}.jpg`, resized.buffer, {
      access: "public",
      contentType: resized.contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    // Blob dosya adı sabit (allowOverwrite) olduğu için aynı URL'yi CDN/tarayıcı
    // önbellekleri (Cache-Control: public, max-age=30 gün) eski baytlarla
    // tutmaya devam ediyordu — bir görsel değiştirildiğinde katalogdaki bazı
    // sayfalar yeni fotoğrafı, bazıları hâlâ eskisini gösteriyordu (bkz.
    // kullanıcı geri bildirimi: "Yamaha XMAX 250'de 2 farklı resim gözüküyor").
    // ?v= sürüm parametresi DB'ye kaydedilen URL'yi HER yüklemede tekilleştirir,
    // böylece önbellekler asla eski görseli sunmaz — "son yüklenen" garanti olur.
    const versionedUrl = `${blob.url}?v=${Date.now()}`;

    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl: versionedUrl },
    });

    return NextResponse.json({ ok: true, imageUrl: versionedUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
