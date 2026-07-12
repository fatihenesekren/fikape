import { z } from "zod";

// Ortak parçalar
const score = z.number().min(1, "Puanlar 1-10 arasında olmalıdır.").max(10, "Puanlar 1-10 arasında olmalıdır.");

export const reviewCreateSchema = z.object({
  productSlug:    z.string().min(1, "Araç zorunludur."),
  scoreFiyat:      score,
  scoreKalite:     score,
  scorePerformans: score,
  summaryText:    z.string().optional(),
  detailText:     z.string().optional().nullable(),
  wouldBuyAgain:  z.boolean().optional().nullable(),
  ownershipMonths: z.union([z.number(), z.string()]).optional().nullable(),
  extendedData:   z.record(z.string(), z.unknown()).optional().nullable(),
  pros:           z.array(z.string()).max(3, "En fazla 3 artı seçebilirsiniz.").optional(),
  cons:           z.array(z.string()).max(3, "En fazla 3 eksi seçebilirsiniz.").optional(),
  photoUrls:      z.array(z.string().url()).max(3).optional(),
});

export const passwordSchema = z.string()
  .min(8, "Şifre en az 8 karakter olmalıdır.")
  .max(72, "Şifre en fazla 72 karakter olabilir.")
  .regex(/[A-ZÇĞİÖŞÜ]/, "Şifre en az 1 büyük harf içermelidir.")
  .regex(/[a-zçğıöşü]/, "Şifre en az 1 küçük harf içermelidir.")
  .regex(/[0-9]/, "Şifre en az 1 rakam içermelidir.")
  .regex(/[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\;'`~]/, "Şifre en az 1 özel karakter içermelidir.")
  .regex(/^\S*$/, "Şifre boşluk karakteri içeremez.");

export const displayNameSchema = z.string().trim()
  .min(3, "Görünen ad en az 3 karakter olmalıdır.")
  .max(30, "Görünen ad en fazla 30 karakter olabilir.")
  .regex(/^[A-Za-zÇĞİÖŞÜçğıöşü. -]+$/, "Görünen ad sadece harf, boşluk, nokta ve tire içerebilir.")
  .refine((v) => /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(v), "Görünen ad en az 1 harf içermelidir.");

export const registerSchema = z.object({
  email:       z.string().trim().min(1, "E-posta ve şifre zorunludur.").email("Geçerli bir e-posta adresi giriniz."),
  password:    passwordSchema,
  displayName: displayNameSchema,
  ref:         z.string().optional().nullable(),
  consent:     z.literal(true, { error: "Gizlilik Politikası ve Kullanım Koşulları'nı kabul etmelisiniz." }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "E-posta zorunludur.").email("Geçerli bir e-posta adresi giriniz."),
});

export const resetPasswordSchema = z.object({
  token:    z.string().min(1, "Geçersiz bağlantı."),
  password: passwordSchema,
});

export const vehicleSuggestSchema = z.object({
  brandName:    z.string().trim().min(1, "Marka ve model zorunludur."),
  modelName:    z.string().trim().min(1, "Marka ve model zorunludur."),
  year:         z.union([z.number(), z.string()]).optional().nullable(),
  trimName:     z.string().trim().optional().nullable(),
  fuelType:     z.enum(["GASOLINE", "DIESEL", "EV", "PHEV", "HYBRID", "LPG"], { error: "Geçersiz yakıt tipi." }).optional().nullable(),
  categorySlug: z.enum(["otomobil", "motosiklet", "e-scooter", "e-bisiklet", "karavan", "kamyonet"], { error: "Geçersiz kategori." }),
  scoreFiyat:      score,
  scoreKalite:     score,
  scorePerformans: score,
  summaryText:    z.string(),
  detailText:     z.string().optional().nullable(),
  wouldBuyAgain:  z.boolean().optional().nullable(),
  ownershipMonths: z.union([z.number(), z.string()]).optional().nullable(),
  extendedData:   z.record(z.string(), z.unknown()).optional().nullable(),
});

export const questionCreateSchema = z.object({
  productSlug: z.string().min(1, "Araç zorunludur."),
  text:        z.string().trim().min(10, "En az 10 karakter yazınız.").max(300, "En fazla 300 karakter yazabilirsiniz."),
});

export const answerCreateSchema = z.object({
  text: z.string().trim().min(5, "En az 5 karakter yazınız.").max(500, "En fazla 500 karakter yazabilirsiniz."),
});

export const insuranceLeadSchema = z.object({
  productId: z.union([z.number(), z.string()]),
  fullName:  z.string().trim().min(2, "Ad soyad zorunludur.").max(100),
  phone:     z.string().trim().min(10, "Geçerli bir telefon numarası giriniz.").max(20),
});

export const saleLeadSchema = z.object({
  productId: z.union([z.number(), z.string()]),
  type:      z.enum(["EXPERTISE", "QUICK_OFFER"], { error: "Geçersiz talep türü." }),
  fullName:  z.string().trim().min(2, "Ad soyad zorunludur.").max(100),
  phone:     z.string().trim().min(10, "Geçerli bir telefon numarası giriniz.").max(20),
});

export const plusWaitlistSchema = z.object({
  email: z.string().trim().min(1, "E-posta zorunludur.").email("Geçerli bir e-posta adresi giriniz."),
  note:  z.string().trim().max(280).optional().nullable(),
});

export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Geçersiz istek.";
}
