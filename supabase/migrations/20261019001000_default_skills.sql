-- Provide a small starter vocabulary for new service listings.
-- The normalized-name conflict guard keeps this safe to rerun and preserves
-- any student-created skill that already uses one of these names.
insert into public.skills (name, normalized_name, created_by)
values
  ('Photography', 'photography', null),
  ('Graphic Design', 'graphic design', null),
  ('Web Design', 'web design', null),
  ('Video Editing', 'video editing', null),
  ('Tutoring', 'tutoring', null),
  ('Mathematics', 'mathematics', null),
  ('Writing', 'writing', null),
  ('Music', 'music', null),
  ('Social Media', 'social media', null),
  ('Resume Review', 'resume review', null)
on conflict (normalized_name) do nothing;
