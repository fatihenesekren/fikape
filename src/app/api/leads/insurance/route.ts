import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { insuranceLeadSchema, formatZodError } from "@/lib/schemas";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const parsed = insuranceLeadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { fullName, phone } = parsed.data;
  const productId = Number(parsed.data.productId);
  const userId = Number(session.user.id);

  const userProduct = await prisma.userProduct.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (!userProduct || userProduct.ownershipStatus !== "CURRENT") {
    return NextResponse.json({ error: "Bu araç garajında değil." }, { status: 404 });
  }

  const existing = await prisma.insuranceLead.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Bu araç için zaten talep gönderdin." }, { status: 409 });
  }

  const lead = await prisma.insuranceLead.create({
    data: { userId, productId, fullName, phone },
  });

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
