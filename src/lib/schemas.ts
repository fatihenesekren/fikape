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

export const registerSchema = z.object({
  email:       z.string().trim().min(1, "E-posta ve şifre zorunludur.").email("Geçerli bir e-posta adresi girin."),
  password:    z.string().min(8, "Şifre en az 8 karakter olmalıdır."),
  displayName: z.string().trim().max(80).optional().nullable(),
  ref:         z.string().optional().nullable(),
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

export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Geçersiz istek.";
}
