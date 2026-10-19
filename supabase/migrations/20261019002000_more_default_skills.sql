insert into public.skills (name, normalized_name, created_by)
values
  ('Barber', 'barber', null),
  ('Haircut', 'haircut', null),
  ('Nails', 'nails', null)
on conflict (normalized_name) do nothing;
