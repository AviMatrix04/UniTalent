-- Provision profiles for Auth users created before the profile trigger existed.

insert into public.profiles (id, full_name)
select
  users.id,
  case
    when pg_catalog.char_length(
      pg_catalog.btrim(users.raw_user_meta_data->>'full_name')
    ) between 2 and 80
      then pg_catalog.btrim(users.raw_user_meta_data->>'full_name')
    else null
  end
from auth.users as users
where users.deleted_at is null
on conflict (id) do nothing;
