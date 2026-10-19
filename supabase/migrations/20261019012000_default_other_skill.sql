-- Keep services discoverable under "Other" when no specific skill was selected.
insert into public.service_skills (service_id, skill_id, position)
select services.id, skills.id, 0
from public.services
cross join public.skills
where skills.normalized_name = 'other'
  and not exists (
    select 1
    from public.service_skills
    where service_skills.service_id = services.id
  );
