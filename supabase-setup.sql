create table if not exists public.products (
  id text primary key,
  title text not null,
  subject text,
  category text,
  chapter text,
  amount integer not null,
  currency text not null default 'INR',
  file_path text,
  demo_path text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id bigint generated always as identity primary key,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  product_id text references public.products(id),
  amount integer,
  currency text default 'INR',
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.purchases enable row level security;

create policy "Public can read active products" on public.products
for select using (active = true);

insert into public.products (id, title, subject, category, chapter, amount, currency, file_path, demo_path, active)
values ('cell-biology', 'Cell Biology Notes', 'biology', 'Botany', 'Cell Structure and Function', 4900, 'INR', '/biology-cell-notes.pdf', '/demo-view.html', true)
on conflict (id) do update set title = excluded.title, amount = excluded.amount, file_path = excluded.file_path, demo_path = excluded.demo_path, active = excluded.active;
