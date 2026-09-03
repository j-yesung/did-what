drop index if exists public.records_owner_recorded_at_idx;

create index records_owner_recorded_at_id_idx
on public.records (owner_id, recorded_at desc, created_at desc, id desc);
