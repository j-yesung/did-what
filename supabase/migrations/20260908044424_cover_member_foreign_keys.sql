-- 복합 외래 키의 전체 컬럼을 같은 순서로 인덱싱한다.
drop index public.records_author_member_id_idx;
create index records_owner_author_member_idx
on public.records (owner_id, author_member_id);

drop index public.push_subscriptions_member_id_idx;
create index push_subscriptions_owner_member_idx
on public.push_subscriptions (owner_id, member_id);
