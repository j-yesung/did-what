revoke update (body) on table public.record_comments from authenticated;

drop policy if exists "Users update their own record comments" on public.record_comments;

drop trigger if exists record_comments_set_updated_at on public.record_comments;
