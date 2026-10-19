-- Save service content and its ordered skill tags in one transaction.
create function private.set_service_skills(
  target_service_id uuid,
  skill_names text[]
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  cleaned_names text[] := coalesce(skill_names, array[]::text[]);
  raw_name text;
  display_name text;
  normalized text;
  selected_skill_id uuid;
  skill_position smallint := 0;
begin
  if not private.owns_service(target_service_id) then
    raise insufficient_privilege
      using message = 'You can manage skills only for your own service.';
  end if;

  if pg_catalog.cardinality(cleaned_names) > 5 then
    raise check_violation using message = 'A service can have at most five skills.';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(cleaned_names) as submitted(name)
    group by public.normalize_skill_name(submitted.name)
    having pg_catalog.count(*) > 1
  )
  then
    raise unique_violation using message = 'Each skill can be selected only once.';
  end if;

  delete from public.service_skills
  where service_id = target_service_id;

  foreach raw_name in array cleaned_names
  loop
    display_name := pg_catalog.regexp_replace(
      pg_catalog.btrim(raw_name),
      '[[:space:]]+',
      ' ',
      'g'
    );

    if pg_catalog.char_length(display_name) not between 1 and 50 then
      raise check_violation
        using message = 'Skills must use between 1 and 50 characters.';
    end if;

    normalized := public.normalize_skill_name(display_name);

    insert into public.skills (name, normalized_name, created_by)
    values (display_name, normalized, (select auth.uid()))
    on conflict (normalized_name) do nothing;

    select id
    into selected_skill_id
    from public.skills
    where normalized_name = normalized
      and not is_hidden;

    if selected_skill_id is null then
      raise check_violation
        using message = 'One of the selected skills is unavailable.';
    end if;

    insert into public.service_skills (service_id, skill_id, position)
    values (target_service_id, selected_skill_id, skill_position);

    skill_position := skill_position + 1;
    selected_skill_id := null;
  end loop;
end;
$$;

revoke execute on function private.set_service_skills(uuid, text[]) from public;
grant execute on function private.set_service_skills(uuid, text[]) to authenticated;

create function public.save_service(
  target_service_id uuid,
  service_title text,
  service_description text,
  service_price_cents integer,
  service_price_unit public.pricing_unit,
  skill_names text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_service_id uuid;
begin
  if not private.is_verified_sdsu_student() then
    raise insufficient_privilege
      using message = 'A verified SDSU account is required.';
  end if;

  if target_service_id is null then
    insert into public.services (
      student_id,
      title,
      description,
      price_cents,
      price_unit,
      status
    )
    values (
      (select auth.uid()),
      service_title,
      service_description,
      service_price_cents,
      service_price_unit,
      'draft'
    )
    returning id into saved_service_id;
  else
    update public.services
    set
      title = service_title,
      description = service_description,
      price_cents = service_price_cents,
      price_unit = service_price_unit
    where id = target_service_id
      and student_id = (select auth.uid())
      and status <> 'hidden'
    returning id into saved_service_id;

    if saved_service_id is null then
      raise exception using
        errcode = 'P0001',
        message = 'That service was not found or cannot be edited.';
    end if;
  end if;

  perform private.set_service_skills(saved_service_id, skill_names);
  return saved_service_id;
end;
$$;

revoke execute on function public.save_service(
  uuid,
  text,
  text,
  integer,
  public.pricing_unit,
  text[]
) from public;
grant execute on function public.save_service(
  uuid,
  text,
  text,
  integer,
  public.pricing_unit,
  text[]
) to authenticated;

create function public.search_services(
  search_query text default null,
  skill_filters text[] default array[]::text[],
  min_price_cents integer default null,
  max_price_cents integer default null,
  sort_option text default 'newest'
)
returns table (
  service_id uuid,
  title text,
  description text,
  price_cents integer,
  price_unit public.pricing_unit,
  published_at timestamptz,
  provider_id uuid,
  provider_name text,
  skill_names text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    service.id,
    service.title,
    service.description,
    service.price_cents,
    service.price_unit,
    service.published_at,
    profile.id,
    profile.full_name,
    coalesce(
      array(
        select skill.name
        from public.service_skills as link
        join public.skills as skill on skill.id = link.skill_id
        where link.service_id = service.id
          and not skill.is_hidden
        order by link.position
      ),
      array[]::text[]
    )
  from public.services as service
  join public.profiles as profile on profile.id = service.student_id
  where private.is_verified_sdsu_student()
    and service.status = 'published'
    and (
      search_query is null
      or pg_catalog.btrim(search_query) = ''
      or service.title ilike '%' || pg_catalog.btrim(search_query) || '%'
      or service.description ilike '%' || pg_catalog.btrim(search_query) || '%'
      or exists (
        select 1
        from public.service_skills as search_link
        join public.skills as search_skill on search_skill.id = search_link.skill_id
        where search_link.service_id = service.id
          and not search_skill.is_hidden
          and search_skill.name ilike '%' || pg_catalog.btrim(search_query) || '%'
      )
    )
    and (
      pg_catalog.cardinality(coalesce(skill_filters, array[]::text[])) = 0
      or exists (
        select 1
        from public.service_skills as filter_link
        join public.skills as filter_skill on filter_skill.id = filter_link.skill_id
        where filter_link.service_id = service.id
          and not filter_skill.is_hidden
          and filter_skill.normalized_name in (
            select public.normalize_skill_name(filter_value)
            from pg_catalog.unnest(skill_filters) as selected(filter_value)
          )
      )
    )
    and (min_price_cents is null or service.price_cents >= min_price_cents)
    and (max_price_cents is null or service.price_cents <= max_price_cents)
  order by
    case when sort_option = 'price_asc' then service.price_cents end asc,
    case when sort_option = 'price_desc' then service.price_cents end desc,
    service.published_at desc,
    service.id;
$$;

create function public.popular_skills(result_limit integer default 8)
returns table (
  name text,
  normalized_name text,
  service_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    skill.name,
    skill.normalized_name,
    pg_catalog.count(distinct service.id) as service_count
  from public.skills as skill
  join public.service_skills as link on link.skill_id = skill.id
  join public.services as service on service.id = link.service_id
  where private.is_verified_sdsu_student()
    and not skill.is_hidden
    and service.status = 'published'
  group by skill.id, skill.name, skill.normalized_name
  order by service_count desc, skill.normalized_name
  limit greatest(0, least(result_limit, 20));
$$;

revoke execute on function public.search_services(
  text,
  text[],
  integer,
  integer,
  text
) from public;
revoke execute on function public.popular_skills(integer) from public;
grant execute on function public.search_services(
  text,
  text[],
  integer,
  integer,
  text
) to authenticated;
grant execute on function public.popular_skills(integer) to authenticated;
