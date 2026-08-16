create table if not exists public.minstrel_songs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  artist text not null default 'YAM Minstrels' check (char_length(artist) between 1 and 120),
  lyrics text not null check (char_length(lyrics) between 1 and 12000),
  price text not null default '',
  buy_url text not null default '',
  published boolean not null default true,
  display_order integer not null default 0 check (display_order between 0 and 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.minstrel_songs enable row level security;

drop policy if exists "Published minstrel songs are publicly readable" on public.minstrel_songs;
drop policy if exists "Admins can read minstrel drafts" on public.minstrel_songs;
drop policy if exists "Admins can insert minstrel songs" on public.minstrel_songs;
drop policy if exists "Admins can update minstrel songs" on public.minstrel_songs;
drop policy if exists "Admins can delete minstrel songs" on public.minstrel_songs;

create policy "Published minstrel songs are publicly readable"
on public.minstrel_songs for select
to anon, authenticated
using (published);

create policy "Admins can read minstrel drafts"
on public.minstrel_songs for select
to authenticated
using ((select public.is_yam_admin()));

create policy "Admins can insert minstrel songs"
on public.minstrel_songs for insert
to authenticated
with check ((select public.is_yam_admin()));

create policy "Admins can update minstrel songs"
on public.minstrel_songs for update
to authenticated
using ((select public.is_yam_admin()))
with check ((select public.is_yam_admin()));

create policy "Admins can delete minstrel songs"
on public.minstrel_songs for delete
to authenticated
using ((select public.is_yam_admin()));

revoke all on public.minstrel_songs from anon, authenticated;
grant select (id, title, artist, lyrics, price, buy_url, published, display_order, created_at, updated_at)
on public.minstrel_songs to anon, authenticated;
grant insert, update, delete on public.minstrel_songs to authenticated;
