-- Create a function to get random authors efficiently
create or replace function get_random_authors(limit_count int)
returns setof authors
language sql
as $$
  select *
  from authors
  order by random()
  limit limit_count;
$$;
