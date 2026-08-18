create table if not exists public.products (
  id text primary key,
  title text not null,
  subject text not null,
  category text not null,
  chapter text not null,
  price_paise integer not null default 4900,
  demo_path text,
  file_path text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id bigint generated always as identity primary key,
  product_id text not null references public.products(id),
  razorpay_order_id text unique not null,
  razorpay_payment_id text unique,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.purchases enable row level security;

create policy "Public can read active products" on public.products for select using (active = true);

insert into public.products (id,title,subject,category,chapter,price_paise,demo_path,file_path,active)
values ('cell-biology','Cell Biology Notes','biology','Botany','Cell Structure and Function',4900,'demos/cell-biology-demo.pdf','notes/cell-biology-full.pdf',true)
on conflict (id) do update set title=excluded.title, subject=excluded.subject, category=excluded.category, chapter=excluded.chapter, price_paise=excluded.price_paise, demo_path=excluded.demo_path, file_path=excluded.file_path, active=excluded.active;