alter table public.push_subscriptions
  drop constraint push_subscriptions_label_length,
  drop column label;
