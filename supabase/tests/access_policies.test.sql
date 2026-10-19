begin;

create extension if not exists pgtap with schema extensions;

select plan(71);

-- Keep assertions deterministic when the local development seed is enabled.
-- The surrounding transaction rolls this cleanup back after the suite.
truncate table
  public.service_reports,
  public.portfolio_items,
  public.service_skills,
  public.services,
  public.contact_methods,
  public.skills,
  public.user_roles,
  public.profiles
cascade;

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'owner@sdsu.edu',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Owner Student"}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'other@sdsu.edu',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Other Student"}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'outsider@example.com',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Outside User"}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'admin@sdsu.edu',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin Student"}',
    now(),
    now()
  );

insert into public.user_roles (user_id, role)
values ('10000000-0000-0000-0000-000000000004', 'admin');

insert into public.contact_methods (
  id,
  profile_id,
  type,
  value,
  is_visible
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'email',
    'owner@sdsu.edu',
    true
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'phone',
    '6195550100',
    false
  );

select results_eq(
  $$
    select public, file_size_limit
    from storage.buckets
    where id = 'avatars'
  $$,
  $$values (false, 5242880::bigint)$$,
  'the avatar bucket is private and limited to 5 MB files'
);

select throws_ok(
  $$
    update public.profiles
    set avatar_path = 'another-user/avatar.png'
    where id = '10000000-0000-0000-0000-000000000001'
  $$,
  '23514',
  null,
  'a profile cannot reference an avatar outside its owner folder'
);

insert into public.services (
  id,
  student_id,
  title,
  description,
  price_cents,
  price_unit,
  status,
  published_at
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Owner Draft',
    'A complete description for the owner draft.',
    2500,
    'hour',
    'draft',
    null
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Published Service',
    'A complete description for a published service.',
    5000,
    'project',
    'published',
    now()
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'Private Draft',
    'A complete description for another private draft.',
    4000,
    'hour',
    'draft',
    null
  );

insert into public.skills (id, name, normalized_name, created_by, is_hidden)
values
  (
    '30000000-0000-0000-0000-000000000001',
    'Policy Test Photography',
    'policy test photography',
    '10000000-0000-0000-0000-000000000002',
    false
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'Hidden Skill',
    'hidden skill',
    '10000000-0000-0000-0000-000000000002',
    true
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'Photography',
    'photography',
    null,
    false
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    'Web Design',
    'web design',
    null,
    false
  );

insert into public.service_skills (service_id, skill_id, position)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    0
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    0
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000002',
    0
  );

insert into public.portfolio_items (
  id,
  service_id,
  storage_path,
  mime_type,
  size_bytes,
  sort_order,
  is_cover
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'portfolios/owner/draft/one.jpg',
    'image/jpeg',
    1000,
    0,
    true
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'portfolios/other/published/one.png',
    'image/png',
    1000,
    0,
    true
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000003',
    'portfolios/other/draft/one.jpg',
    'image/jpeg',
    1000,
    0,
    true
  );

select is(
  public.hook_restrict_sdsu_signup(
    '{"user":{"email":"student@sdsu.edu"}}'::jsonb
  ),
  '{}'::jsonb,
  'the signup hook accepts the exact SDSU domain'
);

select is(
  (
    public.hook_restrict_sdsu_signup(
      '{"user":{"email":"student@example.com"}}'::jsonb
    )->'error'->>'http_code'
  )::integer,
  403,
  'the signup hook rejects a non-SDSU domain'
);

select results_eq(
  $$
    select full_name
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000001'
  $$,
  array['Owner Student'::text],
  'creating an Auth user provisions a profile from safe metadata'
);

select throws_ok(
  $$
    insert into public.contact_methods (profile_id, type, value)
    values ('10000000-0000-0000-0000-000000000002', 'email', 'not-an-email')
  $$,
  '23514',
  null,
  'the database rejects an invalid contact email'
);

select throws_ok(
  $$
    insert into public.contact_methods (profile_id, type, value)
    values ('10000000-0000-0000-0000-000000000001', 'phone', '123')
  $$,
  '23514',
  null,
  'the database rejects an invalid contact phone number'
);

select throws_ok(
  $$
    insert into public.contact_methods (profile_id, type, value)
    values ('10000000-0000-0000-0000-000000000001', 'instagram', 'invalid handle!')
  $$,
  '23514',
  null,
  'the database rejects an invalid Instagram handle'
);

select throws_ok(
  $$
    insert into public.contact_methods (profile_id, type, value)
    values ('10000000-0000-0000-0000-000000000001', 'linkedin', 'https://example.com/student')
  $$,
  '23514',
  null,
  'the database rejects a non-LinkedIn profile URL'
);

set local role anon;

select throws_ok(
  $$select * from public.profiles$$,
  '42501',
  null,
  'anonymous visitors have no profile-table privilege'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","email":"outsider@example.com"}';

select results_eq(
  $$select count(*) from public.profiles$$,
  array[0::bigint],
  'a non-SDSU authenticated user cannot read profiles'
);

set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","email":"owner@sdsu.edu"}';

select results_eq(
  $$select count(*) from public.profiles$$,
  array[4::bigint],
  'a verified SDSU student can read profiles'
);

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name, owner_id)
    values (
      'avatars',
      '10000000-0000-0000-0000-000000000001/avatar.png',
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  'a student can upload an avatar in their own folder'
);

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner_id)
    values (
      'avatars',
      '10000000-0000-0000-0000-000000000002/avatar.png',
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  '42501',
  null,
  'a student cannot upload an avatar in another student folder'
);

select results_eq(
  $$select count(*) from storage.objects where bucket_id = 'avatars'$$,
  array[1::bigint],
  'a verified student can read stored avatars'
);

set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","email":"outsider@example.com"}';

select results_eq(
  $$select count(*) from storage.objects where bucket_id = 'avatars'$$,
  array[0::bigint],
  'a non-SDSU account cannot read stored avatars'
);

set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","email":"owner@sdsu.edu"}';

select results_eq(
  $$
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'students can delete their own avatar'
      and cmd = 'DELETE'
  $$,
  array[1::bigint],
  'avatar deletion is governed by an explicit storage policy'
);

select results_eq(
  $$select count(*) from public.services$$,
  array[2::bigint],
  'a student sees published services and their own drafts'
);

select results_eq(
  $$select count(*) from public.contact_methods$$,
  array[1::bigint],
  'a student cannot read another student hidden contact'
);

select results_eq(
  $$select count(*) from public.skills where normalized_name = 'hidden skill'$$,
  array[0::bigint],
  'a student cannot read another student hidden skill'
);

select results_eq(
  $$select count(*) from public.service_skills$$,
  array[2::bigint],
  'skill links follow service visibility'
);

select results_eq(
  $$select count(*) from public.portfolio_items$$,
  array[2::bigint],
  'portfolio metadata follows service visibility'
);

select results_eq(
  $$
    with changed as (
      update public.profiles
      set bio = 'My updated profile biography.'
      where id = '10000000-0000-0000-0000-000000000001'
      returning 1
    )
    select count(*) from changed
  $$,
  array[1::bigint],
  'a student can update their own profile'
);

select results_eq(
  $$
    with changed as (
      update public.profiles
      set bio = 'This update must not happen.'
      where id = '10000000-0000-0000-0000-000000000002'
      returning 1
    )
    select count(*) from changed
  $$,
  array[0::bigint],
  'a student cannot update another profile'
);

select lives_ok(
  $$
    insert into public.contact_methods (profile_id, type, value)
    values (
      '10000000-0000-0000-0000-000000000001',
      'phone',
      '6195550199'
    )
  $$,
  'a student can add their own contact method'
);

select throws_ok(
  $$
    insert into public.contact_methods (profile_id, type, value)
    values (
      '10000000-0000-0000-0000-000000000002',
      'instagram',
      'not-the-owner'
    )
  $$,
  '42501',
  null,
  'a student cannot add another profile contact method'
);

select throws_ok(
  $$
    insert into public.skills (name, normalized_name, created_by)
    values (
      'Unapproved Skill',
      'unapproved skill',
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  '42501',
  null,
  'a student cannot add an unapproved catalog skill'
);

select throws_ok(
  $$
    insert into public.skills (name, normalized_name, created_by, is_hidden)
    values (
      'Secret Skill',
      'secret skill',
      '10000000-0000-0000-0000-000000000001',
      true
    )
  $$,
  '42501',
  null,
  'a student cannot create a hidden skill'
);

select lives_ok(
  $$
    insert into public.services (
      id,
      student_id,
      title,
      description,
      price_cents,
      price_unit
    )
    values (
      '20000000-0000-0000-0000-000000000004',
      '10000000-0000-0000-0000-000000000001',
      'Second Owner Draft',
      'A complete description for another owner draft.',
      3000,
      'hour'
    )
  $$,
  'a student can create their own draft'
);

select throws_ok(
  $$
    insert into public.services (
      id,
      student_id,
      title,
      description,
      price_cents,
      price_unit
    )
    values (
      '20000000-0000-0000-0000-000000000005',
      '10000000-0000-0000-0000-000000000002',
      'Forged Draft',
      'A student must not create another owner draft.',
      3000,
      'hour'
    )
  $$,
  '42501',
  null,
  'a student cannot create another student draft'
);

select throws_ok(
  $$
    insert into public.services (
      id,
      student_id,
      title,
      description,
      price_cents,
      price_unit,
      status,
      published_at
    )
    values (
      '20000000-0000-0000-0000-000000000006',
      '10000000-0000-0000-0000-000000000001',
      'Direct Publish',
      'A new service must begin as a draft service.',
      3000,
      'hour',
      'published',
      now()
    )
  $$,
  '42501',
  null,
  'a student cannot insert a service as already published'
);

select lives_ok(
  $$
    insert into public.service_skills (service_id, skill_id, position)
    values (
      '20000000-0000-0000-0000-000000000004',
      '30000000-0000-0000-0000-000000000001',
      0
    )
  $$,
  'an owner can add a skill to their service'
);

select throws_ok(
  $$
    insert into public.service_skills (service_id, skill_id, position)
    values (
      '20000000-0000-0000-0000-000000000002',
      '30000000-0000-0000-0000-000000000002',
      1
    )
  $$,
  '42501',
  null,
  'a student cannot add a skill to another service'
);

select lives_ok(
  $$
    insert into public.portfolio_items (
      service_id,
      storage_path,
      mime_type,
      size_bytes,
      sort_order
    )
    values (
      '20000000-0000-0000-0000-000000000004',
      'portfolios/owner/second/two.jpg',
      'image/jpeg',
      1000,
      0
    )
  $$,
  'an owner can add portfolio metadata to their service'
);

select throws_ok(
  $$
    insert into public.portfolio_items (
      service_id,
      storage_path,
      mime_type,
      size_bytes,
      sort_order
    )
    values (
      '20000000-0000-0000-0000-000000000002',
      'portfolios/owner/forged/two.jpg',
      'image/jpeg',
      1000,
      1
    )
  $$,
  '42501',
  null,
  'a student cannot add portfolio metadata to another service'
);

select results_eq(
  $$
    with changed as (
      update public.services
      set status = 'published', published_at = now()
      where id = '20000000-0000-0000-0000-000000000001'
      returning 1
    )
    select count(*) from changed
  $$,
  array[1::bigint],
  'an owner with a visible contact can publish their service'
);

update public.profiles
set bio = null
where id = '10000000-0000-0000-0000-000000000001';

select throws_ok(
  $$select public.publish_service('20000000-0000-0000-0000-000000000004')$$,
  'P0001',
  'Complete your name and bio before publishing.',
  'publishing rejects an incomplete provider profile'
);

update public.profiles
set bio = 'My restored profile biography.'
where id = '10000000-0000-0000-0000-000000000001';

update public.contact_methods
set is_visible = false
where profile_id = '10000000-0000-0000-0000-000000000001';

select throws_ok(
  $$select public.publish_service('20000000-0000-0000-0000-000000000004')$$,
  'P0001',
  'Add at least one visible contact method before publishing.',
  'publishing rejects a provider without a visible contact method'
);

update public.contact_methods
set is_visible = true
where profile_id = '10000000-0000-0000-0000-000000000001'
  and type = 'email';

select lives_ok(
  $$select public.publish_service('20000000-0000-0000-0000-000000000004')$$,
  'the lifecycle function publishes a valid owner service'
);

select results_eq(
  $$
    select status::text
    from public.services
    where id = '20000000-0000-0000-0000-000000000004'
      and published_at is not null
  $$,
  array['published'::text],
  'publishing atomically sets the status and publication timestamp'
);

select lives_ok(
  $$select public.archive_service('20000000-0000-0000-0000-000000000004')$$,
  'an owner can archive their published service'
);

select results_eq(
  $$
    select status::text
    from public.services
    where id = '20000000-0000-0000-0000-000000000004'
  $$,
  array['archived'::text],
  'an archived service records its new state'
);

select lives_ok(
  $$select public.publish_service('20000000-0000-0000-0000-000000000004')$$,
  'an owner can republish an archived service'
);

select results_eq(
  $$
    select status::text
    from public.services
    where id = '20000000-0000-0000-0000-000000000004'
  $$,
  array['published'::text],
  'republishing restores the published state'
);

select throws_ok(
  $$select public.publish_service('20000000-0000-0000-0000-000000000003')$$,
  'P0001',
  'That service cannot be published.',
  'a student cannot publish another student service'
);

select lives_ok(
  $$
    select public.save_service(
      '20000000-0000-0000-0000-000000000004',
      'Second Owner Draft',
      'A complete description for another owner draft.',
      3000,
      'hour',
      array['Photography', 'Web Design']
    )
  $$,
  'saving a service atomically attaches ordered skills'
);

select results_eq(
  $$
    select count(*)
    from public.service_skills
    where service_id = '20000000-0000-0000-0000-000000000004'
  $$,
  array[2::bigint],
  'a saved service contains its selected skills'
);

select results_eq(
  $$select count(*) from public.skills where normalized_name = 'web design'$$,
  array[1::bigint],
  'normalized skill names reuse the existing skill record'
);

select throws_ok(
  $$
    select public.save_service(
      '20000000-0000-0000-0000-000000000004',
      'Second Owner Draft',
      'A complete description for another owner draft.',
      3000,
      'hour',
      array['Design', ' design ']
    )
  $$,
  '23505',
  'Each skill can be selected only once.',
  'duplicate normalized skills are rejected'
);

select throws_ok(
  $$
    select public.save_service(
      '20000000-0000-0000-0000-000000000004',
      'Second Owner Draft',
      'A complete description for another owner draft.',
      3000,
      'hour',
      array['One', 'Two', 'Three', 'Four', 'Five', 'Six']
    )
  $$,
  '23514',
  'A service can have at most five skills.',
  'more than five skills are rejected transactionally'
);

select results_eq(
  $$
    select count(*)
    from public.search_services(
      null,
      array['policy test photography', 'photography'],
      null,
      null,
      'newest'
    )
  $$,
  array[3::bigint],
  'discovery filters published services by any selected skill'
);

select results_eq(
  $$
    select count(*)
    from public.search_services('web design', array[]::text[], null, null, 'newest')
  $$,
  array[1::bigint],
  'discovery search matches skill names'
);

select results_eq(
  $$
    select count(*)
    from public.search_services(null, array[]::text[], 4000, null, 'newest')
  $$,
  array[1::bigint],
  'discovery applies price boundaries only to published services'
);

select results_eq(
  $$
    select service_id
    from public.search_services(null, array[]::text[], null, null, 'price_desc')
    limit 1
  $$,
  array['20000000-0000-0000-0000-000000000002'::uuid],
  'discovery sorts published services by descending price'
);

select throws_ok(
  $$
    update public.services
    set status = 'hidden'
    where id = '20000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'a student cannot hide their own service'
);

select lives_ok(
  $$
    insert into public.service_reports (service_id, reporter_id, reason)
    values (
      '20000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000001',
      'spam'
    )
  $$,
  'a student can report another published service'
);

select throws_ok(
  $$
    insert into public.service_reports (service_id, reporter_id, reason)
    values (
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      'spam'
    )
  $$,
  '42501',
  null,
  'a student cannot report their own service'
);

set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","email":"other@sdsu.edu"}';

select results_eq(
  $$select count(*) from public.service_reports$$,
  array[0::bigint],
  'another student cannot read someone else report'
);

set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated","email":"admin@sdsu.edu"}';

select results_eq(
  $$select count(*) from public.service_reports$$,
  array[1::bigint],
  'an administrator can read the report queue'
);

select results_eq(
  $$
    with changed as (
      update public.services
      set status = 'hidden'
      where id = '20000000-0000-0000-0000-000000000002'
      returning 1
    )
    select count(*) from changed
  $$,
  array[1::bigint],
  'an administrator can hide a service'
);

select throws_ok(
  $$
    update public.services
    set title = 'Administrator Rewritten Title'
    where id = '20000000-0000-0000-0000-000000000002'
  $$,
  '42501',
  null,
  'an administrator cannot rewrite provider content'
);

set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","email":"owner@sdsu.edu"}';

select results_eq(
  $$select count(*) from public.user_roles$$,
  array[0::bigint],
  'a student cannot inspect another user role'
);

set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated","email":"admin@sdsu.edu"}';

select results_eq(
  $$select count(*) from public.user_roles$$,
  array[1::bigint],
  'an administrator can inspect assigned roles'
);

set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","email":"owner@sdsu.edu"}';

select results_eq(
  $$select count(*) from public.services$$,
  array[2::bigint],
  'a student cannot read a service after an administrator hides it'
);

select results_eq(
  $$select count(*) from public.service_reports$$,
  array[1::bigint],
  'a reporter can read their own submitted report'
);

select results_eq(
  $$select private.is_verified_sdsu_student()$$,
  array[true],
  'the verified-student helper recognizes a confirmed SDSU account'
);

set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","email":"outsider@example.com"}';

select results_eq(
  $$select private.is_verified_sdsu_student()$$,
  array[false],
  'the verified-student helper rejects a non-SDSU account'
);

set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","email":"owner@sdsu.edu"}';

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name, owner_id)
    values (
      'service-images',
      '10000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000001/photo.jpg',
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  'a service owner can upload to their service image path'
);

set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","email":"other@sdsu.edu"}';

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner_id)
    values (
      'service-images',
      '10000000-0000-0000-0000-000000000002/20000000-0000-0000-0000-000000000001/stolen.jpg',
      '10000000-0000-0000-0000-000000000002'
    )
  $$,
  '42501',
  null,
  'another student cannot upload images to someone else service'
);

select results_eq(
  $$select count(*) from storage.objects where bucket_id = 'service-images'$$,
  array[1::bigint],
  'verified students can read service images'
);

set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","email":"outsider@example.com"}';

select results_eq(
  $$select count(*) from storage.objects where bucket_id = 'service-images'$$,
  array[0::bigint],
  'non-SDSU accounts cannot read service images'
);

reset role;

select * from finish();

rollback;
