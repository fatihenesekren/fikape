import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saleLeadSchema, formatZodError } from "@/lib/schemas";
import { notifyAdmins } from "@/lib/notification";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const parsed = saleLeadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { fullName, phone, type } = parsed.data;
  const productId = Number(parsed.data.productId);
  const userId = Number(session.user.id);

  const userProduct = await prisma.userProduct.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (!userProduct || userProduct.ownershipStatus !== "CURRENT") {
    return NextResponse.json({ error: "Bu araç garajında değil." }, { status: 404 });
  }

  const existing = await prisma.saleLead.findUnique({
    where: { userId_productId_type: { userId, productId, type } },
  });
  if (existing) {
    return NextResponse.json({ error: "Bu araç için zaten talep gönderdin." }, { status: 409 });
  }

  const lead = await prisma.saleLead.create({
    data: { userId, productId, type, fullName, phone },
  });

  notifyAdmins({
    type: "ADMIN_NEW_LEAD",
    message: "Yeni bir satış/ekspertiz talebi geldi.",
    link: "/admin/leads",
    emailSubject: "Yeni satış talebi",
    emailTitle: "Yeni bir satış/ekspertiz talebi geldi",
    emailMessage: "Bir kullanıcı hızlı satış teklifi ya da ekspertiz talep etti.",
    rateLimitKey: "lead",
  }).catch(() => {});

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
