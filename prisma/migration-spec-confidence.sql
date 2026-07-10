-- Migration: VehicleSuggestion.specConfidence (teknik özellik güven skoru izlenebilirliği)
-- Run this in Supabase SQL Editor

ALTER TABLE vehicle_suggestions
  ADD COLUMN IF NOT EXISTS "specConfidence" JSONB;
