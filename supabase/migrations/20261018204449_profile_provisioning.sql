-- Create the application profile immediately after Supabase Auth creates a user.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_full_name text;
begin
  requested_full_name := nullif(
    pg_catalog.btrim(new.raw_user_meta_data->>'full_name'),
    ''
  );

  if requested_full_name is not null
    and pg_catalog.char_length(requested_full_name) not between 2 and 80
  then
    requested_full_name := null;
  end if;

  insert into public.profiles (id, full_name)
  values (new.id, requested_full_name);

  return new;
end;
$$;

revoke execute on function public.handle_new_user()
from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
