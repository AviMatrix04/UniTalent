alter table public.portfolio_items
drop constraint portfolio_items_sort_order_range;

alter table public.portfolio_items
add constraint portfolio_items_sort_order_range
check (sort_order between 0 and 9);

create or replace function public.reorder_portfolio_items(
  target_service_id uuid,
  ordered_item_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_count integer;
begin
  if not private.owns_service(target_service_id) then
    raise insufficient_privilege using message = 'You can reorder only your own portfolio.';
  end if;

  select count(*) into existing_count
  from public.portfolio_items
  where service_id = target_service_id;

  if existing_count <> pg_catalog.cardinality(ordered_item_ids)
     or existing_count > 10
     or exists (
       select 1
       from pg_catalog.unnest(ordered_item_ids) as submitted(id)
       group by submitted.id
       having count(*) > 1
     )
     or exists (
       select 1 from pg_catalog.unnest(ordered_item_ids) as submitted(id)
       where not exists (
         select 1 from public.portfolio_items
         where portfolio_items.id = submitted.id
           and service_id = target_service_id
       )
     )
  then
    raise check_violation using message = 'The portfolio order is invalid.';
  end if;

  set constraints portfolio_items_service_order_unique deferred;

  update public.portfolio_items
  set sort_order = pg_catalog.array_position(ordered_item_ids, id) - 1
  where service_id = target_service_id;
end;
$$;
