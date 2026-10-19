-- Profile photos live in a private bucket. Access is granted through RLS and
-- short-lived signed URLs rather than through public object URLs.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles
add constraint profiles_avatar_path_format
check (
  avatar_path is null
  or avatar_path in (
    id::text || '/avatar.jpg',
    id::text || '/avatar.png'
  )
);

create policy "verified students can read avatars"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and private.is_verified_sdsu_student()
);

create policy "students can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and private.is_verified_sdsu_student()
  and owner_id = (select auth.uid()::text)
  and name in (
    (select auth.uid())::text || '/avatar.jpg',
    (select auth.uid())::text || '/avatar.png'
  )
);

create policy "students can replace their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and private.is_verified_sdsu_student()
  and owner_id = (select auth.uid()::text)
  and name in (
    (select auth.uid())::text || '/avatar.jpg',
    (select auth.uid())::text || '/avatar.png'
  )
);

create policy "students can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid()::text)
);
