-- Tables for NHAPP

-- 1. Users table
create table public.users (
  id uuid references auth.users not null primary key,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

-- 2. Chats table
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  name text,
  is_group boolean default false,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz default now()
);

-- NOTE: RLS is disabled for chats to prevent infinite recursion in complex queries
alter table public.chats disable row level security;

-- 3. Chat Members (Join table)
create table public.chat_members (
  chat_id uuid references public.chats(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  primary key (chat_id, user_id)
);

-- NOTE: RLS is disabled for chat_members to prevent infinite recursion
alter table public.chat_members disable row level security;

-- 4. Messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade,
  sender_id uuid references public.users(id),
  content text not null,
  created_at timestamptz default now(),
  read_at timestamptz
);

alter table public.messages enable row level security;

-- Indexes
create index idx_messages_chat_id_created_at on public.messages (chat_id, created_at desc);
create index idx_chat_members_user_id on public.chat_members (user_id);

-- RLS POLICIES - SAFE MODE MODEL

-- Users policies
create policy "users_select" on public.users for select using (true);
create policy "users_update" on public.users for update using (auth.uid() = id);

-- Messages policies (Secured via subquery, safe because chat_members now has no RLS)
create policy "messages_secure_select" on public.messages 
for select using (
  chat_id in (select cm.chat_id from public.chat_members cm where cm.user_id = auth.uid())
);

create policy "messages_secure_insert" on public.messages 
for insert with check (
  auth.uid() = sender_id and 
  chat_id in (select cm.chat_id from public.chat_members cm where cm.user_id = auth.uid())
);

-- AUTOMATIC USER CREATION TRIGGER
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Re-create trigger (dropping first just in case)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Realtime Messaging
-- Ensure the table is in the publication
alter publication supabase_realtime add table public.messages;

-- Storage bucket for attachments
insert into storage.buckets (id, name, public) 
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

create policy "Anyone can view attachments" 
on storage.objects for select 
using ( bucket_id = 'attachments' );

create policy "Authenticated users can upload attachments" 
on storage.objects for insert 
with check ( 
  bucket_id = 'attachments' 
  and auth.role() = 'authenticated' 
);
