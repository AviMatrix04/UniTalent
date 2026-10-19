-- Local development data only. Never deploy this file to production.
-- Every seeded user can sign in locally with password: UniTalentDemo123!

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'a1100000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'demo.unitalent.01@sdsu.edu',
    extensions.crypt('UniTalentDemo123!', extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Maya Chen"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a1100000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'demo.unitalent.02@sdsu.edu',
    extensions.crypt('UniTalentDemo123!', extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Jordan Lee"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a1100000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'demo.unitalent.03@sdsu.edu',
    extensions.crypt('UniTalentDemo123!', extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sofia Ramirez"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a1100000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'demo.unitalent.admin@sdsu.edu',
    extensions.crypt('UniTalentDemo123!', extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Alex Kim"}',
    now(),
    now()
  );

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    'b1100000-0000-0000-0000-000000000001',
    'a1100000-0000-0000-0000-000000000001',
    'a1100000-0000-0000-0000-000000000001',
    '{"sub":"a1100000-0000-0000-0000-000000000001","email":"demo.unitalent.01@sdsu.edu","email_verified":true}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    'b1100000-0000-0000-0000-000000000002',
    'a1100000-0000-0000-0000-000000000002',
    'a1100000-0000-0000-0000-000000000002',
    '{"sub":"a1100000-0000-0000-0000-000000000002","email":"demo.unitalent.02@sdsu.edu","email_verified":true}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    'b1100000-0000-0000-0000-000000000003',
    'a1100000-0000-0000-0000-000000000003',
    'a1100000-0000-0000-0000-000000000003',
    '{"sub":"a1100000-0000-0000-0000-000000000003","email":"demo.unitalent.03@sdsu.edu","email_verified":true}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    'b1100000-0000-0000-0000-000000000004',
    'a1100000-0000-0000-0000-000000000004',
    'a1100000-0000-0000-0000-000000000004',
    '{"sub":"a1100000-0000-0000-0000-000000000004","email":"demo.unitalent.admin@sdsu.edu","email_verified":true}',
    'email',
    now(),
    now(),
    now()
  );

update public.profiles
set bio = case id
  when 'a1100000-0000-0000-0000-000000000001' then
    'Photographer helping students capture portraits, events, and graduation memories.'
  when 'a1100000-0000-0000-0000-000000000002' then
    'Applied mathematics student offering patient tutoring and practical study plans.'
  when 'a1100000-0000-0000-0000-000000000003' then
    'Graphic designer creating clear, energetic identities for campus organizations.'
  when 'a1100000-0000-0000-0000-000000000004' then
    'UNI-TALENT development administrator account.'
end
where id in (
  'a1100000-0000-0000-0000-000000000001',
  'a1100000-0000-0000-0000-000000000002',
  'a1100000-0000-0000-0000-000000000003',
  'a1100000-0000-0000-0000-000000000004'
);

insert into public.contact_methods (profile_id, type, value, is_visible)
values
  (
    'a1100000-0000-0000-0000-000000000001',
    'instagram',
    '@maya.demo',
    true
  ),
  (
    'a1100000-0000-0000-0000-000000000002',
    'email',
    'demo.unitalent.02@sdsu.edu',
    true
  ),
  (
    'a1100000-0000-0000-0000-000000000002',
    'linkedin',
    'https://www.linkedin.com/in/jordan-demo',
    true
  ),
  (
    'a1100000-0000-0000-0000-000000000003',
    'instagram',
    '@sofia.design.demo',
    true
  ),
  (
    'a1100000-0000-0000-0000-000000000004',
    'email',
    'demo.unitalent.admin@sdsu.edu',
    false
  );

insert into public.skills (id, name, normalized_name, created_by)
values
  (
    'c1100000-0000-0000-0000-000000000001',
    'Photography',
    'photography',
    'a1100000-0000-0000-0000-000000000001'
  ),
  (
    'c1100000-0000-0000-0000-000000000002',
    'Portrait Photography',
    'portrait photography',
    'a1100000-0000-0000-0000-000000000001'
  ),
  (
    'c1100000-0000-0000-0000-000000000003',
    'Mathematics',
    'mathematics',
    'a1100000-0000-0000-0000-000000000002'
  ),
  (
    'c1100000-0000-0000-0000-000000000004',
    'Tutoring',
    'tutoring',
    'a1100000-0000-0000-0000-000000000002'
  ),
  (
    'c1100000-0000-0000-0000-000000000005',
    'Graphic Design',
    'graphic design',
    'a1100000-0000-0000-0000-000000000003'
  ),
  (
    'c1100000-0000-0000-0000-000000000006',
    'Branding',
    'branding',
    'a1100000-0000-0000-0000-000000000003'
  ),
  (
    'c1100000-0000-0000-0000-000000000007',
    'Resume Review',
    'resume review',
    'a1100000-0000-0000-0000-000000000002'
  ),
  (
    'c1100000-0000-0000-0000-000000000008',
    'Event Flyers',
    'event flyers',
    'a1100000-0000-0000-0000-000000000003'
  ),
  (
    'c1100000-0000-0000-0000-000000000009',
    'Web Design',
    'web design',
    'a1100000-0000-0000-0000-000000000003'
  ),
  (
    'c1100000-0000-0000-0000-000000000010',
    'Video Editing',
    'video editing',
    'a1100000-0000-0000-0000-000000000003'
  ),
  (
    'c1100000-0000-0000-0000-000000000011',
    'Barber',
    'barber',
    'a1100000-0000-0000-0000-000000000003'
  ),
  (
    'c1100000-0000-0000-0000-000000000012',
    'Haircut',
    'haircut',
    'a1100000-0000-0000-0000-000000000003'
  ),
  (
    'c1100000-0000-0000-0000-000000000013',
    'Nails',
    'nails',
    'a1100000-0000-0000-0000-000000000003'
  ),
  (
    'c1100000-0000-0000-0000-000000000014',
    'Other',
    'other',
    null
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
    'd1100000-0000-0000-0000-000000000001',
    'a1100000-0000-0000-0000-000000000001',
    'Campus portrait photography',
    'Relaxed outdoor portrait sessions around campus with edited digital photos included.',
    4500,
    'hour',
    'published',
    now() - interval '8 days'
  ),
  (
    'd1100000-0000-0000-0000-000000000002',
    'a1100000-0000-0000-0000-000000000001',
    'Graduation photo package',
    'A draft package for graduation portraits at several recognizable campus locations.',
    12000,
    'project',
    'draft',
    null
  ),
  (
    'd1100000-0000-0000-0000-000000000003',
    'a1100000-0000-0000-0000-000000000002',
    'Calculus and statistics tutoring',
    'One-on-one tutoring focused on course concepts, practice problems, and exam preparation.',
    2500,
    'hour',
    'published',
    now() - interval '5 days'
  ),
  (
    'd1100000-0000-0000-0000-000000000004',
    'a1100000-0000-0000-0000-000000000002',
    'Resume feedback session',
    'A structured review of resume organization, language, and presentation for internships.',
    3000,
    'project',
    'archived',
    now() - interval '20 days'
  ),
  (
    'd1100000-0000-0000-0000-000000000005',
    'a1100000-0000-0000-0000-000000000003',
    'Logo and visual identity design',
    'A collaborative logo package with color direction and practical files for student organizations.',
    15000,
    'project',
    'published',
    now() - interval '3 days'
  ),
  (
    'd1100000-0000-0000-0000-000000000006',
    'a1100000-0000-0000-0000-000000000003',
    'Free event flyer design',
    'A simple promotional flyer for one student organization event, offered as a free service.',
    0,
    'project',
    'published',
    now() - interval '1 day'
  );

insert into public.service_skills (service_id, skill_id, position)
values
  ('d1100000-0000-0000-0000-000000000001', 'c1100000-0000-0000-0000-000000000001', 0),
  ('d1100000-0000-0000-0000-000000000001', 'c1100000-0000-0000-0000-000000000002', 1),
  ('d1100000-0000-0000-0000-000000000002', 'c1100000-0000-0000-0000-000000000001', 0),
  ('d1100000-0000-0000-0000-000000000002', 'c1100000-0000-0000-0000-000000000002', 1),
  ('d1100000-0000-0000-0000-000000000003', 'c1100000-0000-0000-0000-000000000003', 0),
  ('d1100000-0000-0000-0000-000000000003', 'c1100000-0000-0000-0000-000000000004', 1),
  ('d1100000-0000-0000-0000-000000000004', 'c1100000-0000-0000-0000-000000000007', 0),
  ('d1100000-0000-0000-0000-000000000005', 'c1100000-0000-0000-0000-000000000005', 0),
  ('d1100000-0000-0000-0000-000000000005', 'c1100000-0000-0000-0000-000000000006', 1),
  ('d1100000-0000-0000-0000-000000000006', 'c1100000-0000-0000-0000-000000000005', 0),
  ('d1100000-0000-0000-0000-000000000006', 'c1100000-0000-0000-0000-000000000008', 1);

insert into public.user_roles (user_id, role)
values ('a1100000-0000-0000-0000-000000000004', 'admin');

insert into public.service_reports (
  service_id,
  reporter_id,
  reason,
  details
)
values (
  'd1100000-0000-0000-0000-000000000006',
  'a1100000-0000-0000-0000-000000000004',
  'other',
  'Local seed report for testing the administrator review workflow.'
);
