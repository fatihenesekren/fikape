-- Migration: ContentReport'a "Diğer" (OTHER) hedef türü eklendi
-- Run this in Supabase SQL Editor

-- AlterEnum
ALTER TYPE "ContentReportTargetType" ADD VALUE 'OTHER';
