-- ============================================
-- PASS 3 — Private Storage RLS Policies
-- ============================================
-- This migration should only be applied if the
-- initial schema migration has already been run.
--
-- It adds Storage RLS policies for the
-- business-logos bucket without dropping tables.

-- Drop existing storage policies if present
-- (safe to re-run; ignores missing policies)
DROP POLICY IF EXISTS "Users can view own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;

-- Storage RLS policies for business-logos bucket (PRIVATE)
-- Path structure: {user_id}/{timestamp}.{extension}
-- Policies verify auth.uid() matches the first folder in the path
CREATE POLICY "Users can view own logos" ON storage.objects FOR SELECT USING (
  bucket_id = 'business-logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can upload own logos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'business-logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update own logos" ON storage.objects FOR UPDATE USING (
  bucket_id = 'business-logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own logos" ON storage.objects FOR DELETE USING (
  bucket_id = 'business-logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
