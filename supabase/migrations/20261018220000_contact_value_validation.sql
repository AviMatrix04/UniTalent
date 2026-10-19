-- Keep contact values valid even when writes bypass the web form.

alter table public.contact_methods
add constraint contact_methods_value_format check (
  case type
    when 'email' then
      value ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    when 'phone' then
      value ~ '^[+0-9() .-]+$'
      and char_length(regexp_replace(value, '[^0-9]', '', 'g')) between 7 and 15
    when 'instagram' then
      value ~ '^@[A-Za-z0-9._]{1,30}$'
    when 'linkedin' then
      value ~ '^https://(www\.)?linkedin\.com/in/[A-Za-z0-9_%.-]+/?$'
  end
);
