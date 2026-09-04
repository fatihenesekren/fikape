-- Admin'e özel bildirim tipleri — "bekleyen onay" kuyruklarına yeni bir öğe
-- düştüğünde (yorum, öneri, lead, mesaj/içerik raporu, hesap silme talebi)
-- admin'e site içi bildirim + e-posta gitmesi için.

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_NEW_REVIEW';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_NEW_SUGGESTION';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_NEW_LEAD';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_NEW_MESSAGE_REPORT';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_NEW_CONTENT_REPORT';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_NEW_DELETION_REQUEST';
