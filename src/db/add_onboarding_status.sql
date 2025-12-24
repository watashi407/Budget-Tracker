-- Add has_completed_onboarding column to profiles table if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'has_completed_onboarding') then
        alter table profiles add column has_completed_onboarding boolean default false;
    end if;
end $$;
