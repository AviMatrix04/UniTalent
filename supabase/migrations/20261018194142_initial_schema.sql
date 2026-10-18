-- UNI-TALENT database foundation.
-- Access policies, auth hooks, profile provisioning, and seed data are added in
-- later Phase 1 migrations.

create type public.contact_type as enum (
  'email',
  'phone',
  'instagram',
  'linkedin'
);

create type public.pricing_unit as enum ('hour', 'project');

create type public.service_status as enum (
  'draft',
  'published',
  'archived',
  'hidden'
);

create type public.report_reason as enum (
  'spam',
  'misleading',
  'inappropriate',
  'harassment',
  'other'
);

create type public.report_status as enum (
  'open',
  'reviewed',
  'dismissed',
  'actioned'
);

create type public.app_role as enum ('admin');

create function public.normalize_skill_name(value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.lower(
    pg_catalog.regexp_replace(pg_catalog.btrim(value), '[[:space:]]+', ' ', 'g')
  );
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  bio text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length
    check (full_name is null or char_length(btrim(full_name)) between 2 and 80),
  constraint profiles_bio_length
    check (bio is null or char_length(bio) <= 500),
  constraint profiles_avatar_path_length
    check (avatar_path is null or char_length(avatar_path) between 1 and 500)
);

create table public.contact_methods (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type public.contact_type not null,
  value text not null,
  is_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_methods_profile_type_unique unique (profile_id, type),
  constraint contact_methods_value_length
    check (char_length(btrim(value)) between 1 and 320)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  price_cents integer not null,
  price_unit public.pricing_unit not null,
  status public.service_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_title_length
    check (char_length(btrim(title)) between 5 and 100),
  constraint services_description_length
    check (char_length(btrim(description)) between 20 and 2000),
  constraint services_price_nonnegative check (price_cents >= 0),
  constraint services_publication_timestamp check (
    (status in ('published', 'hidden') and published_at is not null)
    or status in ('draft', 'archived')
  )
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  created_by uuid references public.profiles (id) on delete set null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint skills_normalized_name_unique unique (normalized_name),
  constraint skills_name_length
    check (char_length(btrim(name)) between 1 and 50),
  constraint skills_normalized_name_matches check (
    normalized_name = public.normalize_skill_name(name)
  )
);

create table public.service_skills (
  service_id uuid not null references public.services (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  position smallint not null,
  primary key (service_id, skill_id),
  constraint service_skills_service_position_unique unique (service_id, position),
  constraint service_skills_position_range check (position between 0 and 4)
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  storage_path text not null,
  caption text,
  mime_type text not null,
  size_bytes integer not null,
  sort_order smallint not null,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  constraint portfolio_items_storage_path_unique unique (storage_path),
  constraint portfolio_items_service_order_unique unique (service_id, sort_order),
  constraint portfolio_items_storage_path_length
    check (char_length(storage_path) between 1 and 500),
  constraint portfolio_items_caption_length
    check (caption is null or char_length(caption) <= 240),
  constraint portfolio_items_mime_type
    check (mime_type in ('image/jpeg', 'image/png')),
  constraint portfolio_items_size
    check (size_bytes between 1 and 5242880),
  constraint portfolio_items_sort_order_range check (sort_order between 0 and 5)
);

create table public.service_reports (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason public.report_reason not null,
  details text,
  status public.report_status not null default 'open',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint service_reports_service_reporter_unique unique (service_id, reporter_id),
  constraint service_reports_details_length
    check (details is null or char_length(details) <= 1000),
  constraint service_reports_review_state check (
    (status = 'open' and reviewed_at is null)
    or (status <> 'open' and reviewed_at is not null)
  )
);

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create unique index portfolio_items_one_cover_per_service_idx
  on public.portfolio_items (service_id)
  where is_cover;

create index contact_methods_profile_visible_idx
  on public.contact_methods (profile_id, is_visible);

create index services_student_status_idx
  on public.services (student_id, status);

create index services_published_at_idx
  on public.services (published_at desc)
  where status = 'published';

create index services_published_price_idx
  on public.services (price_cents)
  where status = 'published';

create index skills_visible_name_idx
  on public.skills (normalized_name)
  where not is_hidden;

create index service_skills_skill_service_idx
  on public.service_skills (skill_id, service_id);

create index service_reports_status_created_idx
  on public.service_reports (status, created_at);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger contact_methods_set_updated_at
before update on public.contact_methods
for each row execute function public.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.contact_methods enable row level security;
alter table public.services enable row level security;
alter table public.skills enable row level security;
alter table public.service_skills enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.service_reports enable row level security;
alter table public.user_roles enable row level security;
