ALTER TABLE public.records DISABLE TRIGGER records_set_updated_at;
UPDATE public.records SET category = category[1:1] WHERE cardinality(category) > 1;
ALTER TABLE public.records ENABLE TRIGGER records_set_updated_at;

ALTER TABLE public.records DROP CONSTRAINT records_category_check;
ALTER TABLE public.records ADD CONSTRAINT records_category_check CHECK (
  category <@ ARRAY['daily', 'date', 'travel', 'anniversary', 'gathering']::text[]
  AND cardinality(category) <= 1
  AND (cardinality(category) = 0 OR array_ndims(category) = 1)
  AND array_position(category, NULL) IS NULL
);
