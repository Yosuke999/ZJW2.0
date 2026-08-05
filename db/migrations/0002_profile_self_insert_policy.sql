DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'users create own profile'
  ) THEN
    CREATE POLICY "users create own profile" ON profiles
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() AND role = 'customer' AND status = 'active');
  END IF;
END $$;
