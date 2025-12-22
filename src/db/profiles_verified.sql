-- =============================================
-- PROFILES VERIFIED - FIXED TRIGGER
-- Only updates verified when email_confirmed_at changes
-- =============================================

-- STEP 1: Add verified column (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- STEP 2: Create improved sync function
-- Only updates verified when email_confirmed_at changes from NULL to a value
CREATE OR REPLACE FUNCTION sync_user_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- On INSERT: create profile with verified status
    IF TG_OP = 'INSERT' THEN
        INSERT INTO profiles (id, verified)
        VALUES (NEW.id, NEW.email_confirmed_at IS NOT NULL)
        ON CONFLICT (id) DO NOTHING;  -- Don't overwrite existing profile
    
    -- On UPDATE: only update verified if email_confirmed_at changed from NULL to a value
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only trigger when email_confirmed_at was NULL and now has a value
        IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
            UPDATE profiles
            SET verified = TRUE
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- STEP 3: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_change ON auth.users;
CREATE TRIGGER on_auth_user_change
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION sync_user_verified();

-- STEP 4: Reset all profiles.verified based on CURRENT auth.users data
-- This ensures the current state is accurate
UPDATE profiles p
SET verified = (
    SELECT email_confirmed_at IS NOT NULL
    FROM auth.users u
    WHERE u.id = p.id
);
