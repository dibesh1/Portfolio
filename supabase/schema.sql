-- =====================================================================
-- Portfolio database schema + Row Level Security (RLS)
-- Hardened (security-reviewed) + right-sized data types.
--
-- HOW TO RUN (once):
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file
--   -> Run. Safe to re-run (IF NOT EXISTS / OR REPLACE / DROP IF EXISTS; seed
--   only inserts into empty tables). Then do STEP 2 at the bottom.
--
-- SECURITY MODEL (server-authoritative — the browser is never trusted):
--   * Public visitors (anon key) can READ only rows where is_published = true.
--   * Only an ADMIN can INSERT / UPDATE / DELETE content.
--   * The admin flag lives in a protected `profiles` table, is never writable
--     from the browser, and role changes are blocked for non-admins.
-- =====================================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------ roles
do $$ begin
  create type public.app_role as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       public.app_role not null default 'user',
  created_at timestamptz not null default now()
);
comment on table  public.profiles      is 'One row per auth user; holds the authoritative admin role. Never written from the browser.';
comment on column public.profiles.role is 'Access level. Changed only via SQL editor / service role (see prevent_role_change).';

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.prevent_role_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'not authorized to change role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

revoke execute on function public.handle_new_user()     from public, anon, authenticated;
revoke execute on function public.prevent_role_change()  from public, anon, authenticated;
revoke execute on function public.set_updated_at()       from public, anon, authenticated;

-- -------------------------------------------------------------- content tables
-- Data types are right-sized: smallint for the small bounded values
-- (sort_order, hue); uuid ids are intentional (non-enumerable, safe for a
-- public API); text preserves display formatting (e.g. the '01' labels).
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  sort_order   smallint not null default 0,
  num          text not null,                 -- display label, e.g. '01'
  kind         text not null,                 -- e.g. 'Machine Learning'
  title        text not null,                 -- plain part of the title
  title_accent text,                          -- italic part, rendered in <em>
  description  text not null,
  tags         text[] not null default '{}',
  hue          smallint not null default 222 check (hue between 0 and 360),
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.projects is 'Selected Work cards, ordered by sort_order.';

create table if not exists public.experience_roles (
  id           uuid primary key default gen_random_uuid(),
  sort_order   smallint not null default 0,
  period       text not null,                 -- e.g. 'Dec 2023 — Nov 2024'
  tag          text not null,                 -- e.g. 'Now', '2023', 'BSc'
  title        text not null,
  org          text not null,
  note         text,
  is_current   boolean not null default false,
  bullets      text[] not null default '{}',
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.experience_roles is 'Experience timeline entries, ordered by sort_order.';

create table if not exists public.skill_blocks (
  id           uuid primary key default gen_random_uuid(),
  sort_order   smallint not null default 0,
  title        text not null,
  tags         text[] not null default '{}',
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.skill_blocks is 'Skill groups, ordered by sort_order.';

drop trigger if exists projects_updated on public.projects;
create trigger projects_updated before update on public.projects
  for each row execute function public.set_updated_at();
drop trigger if exists experience_updated on public.experience_roles;
create trigger experience_updated before update on public.experience_roles
  for each row execute function public.set_updated_at();
drop trigger if exists skills_updated on public.skill_blocks;
create trigger skills_updated before update on public.skill_blocks
  for each row execute function public.set_updated_at();

-- Indexes matching the public read pattern: published rows, ordered.
create index if not exists projects_pub_order   on public.projects         (is_published, sort_order);
create index if not exists experience_pub_order on public.experience_roles (is_published, sort_order);
create index if not exists skills_pub_order     on public.skill_blocks     (is_published, sort_order);

-- ---------------------------------------------------------------------- RLS
alter table public.profiles         enable row level security;
alter table public.projects         enable row level security;
alter table public.experience_roles enable row level security;
alter table public.skill_blocks     enable row level security;

-- profiles: read your own (admin reads all). Never written from the browser.
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- content: anyone reads PUBLISHED rows; only admin reads drafts + writes.
drop policy if exists projects_admin_write on public.projects;
drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));
create policy projects_admin_insert on public.projects
  for insert to authenticated with check ((select public.is_admin()));
create policy projects_admin_update on public.projects
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy projects_admin_delete on public.projects
  for delete to authenticated using ((select public.is_admin()));

drop policy if exists experience_admin_write on public.experience_roles;
drop policy if exists experience_read on public.experience_roles;
create policy experience_read on public.experience_roles
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));
create policy experience_admin_insert on public.experience_roles
  for insert to authenticated with check ((select public.is_admin()));
create policy experience_admin_update on public.experience_roles
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy experience_admin_delete on public.experience_roles
  for delete to authenticated using ((select public.is_admin()));

drop policy if exists skills_admin_write on public.skill_blocks;
drop policy if exists skills_read on public.skill_blocks;
create policy skills_read on public.skill_blocks
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));
create policy skills_admin_insert on public.skill_blocks
  for insert to authenticated with check ((select public.is_admin()));
create policy skills_admin_update on public.skill_blocks
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy skills_admin_delete on public.skill_blocks
  for delete to authenticated using ((select public.is_admin()));

-- ------------------------------------------------------- least-privilege grants
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
revoke all on public.projects, public.experience_roles, public.skill_blocks from anon;
grant select on public.projects, public.experience_roles, public.skill_blocks to anon;

-- -------------------------------------------------------------- seed content
-- Your current portfolio content, inserted only when a table is empty.
do $$ begin
if not exists (select 1 from public.projects) then
  insert into public.projects (sort_order, num, kind, title, title_accent, description, tags, hue) values
  (0,'01','Machine Learning','End-to-end','ML pipeline','A complete ML workflow covering preprocessing, feature engineering, model training, and evaluation, built in Python with Pandas, NumPy, and scikit-learn. EDA in Matplotlib and Seaborn translated findings for non-technical stakeholders.', array['Python','scikit-learn','EDA'],222),
  (1,'02','Full-stack','E-Shop','platform','A full-stack e-commerce app with a relational database backend: catalog, cart, and checkout flow integrated via an SQL data layer, REST endpoints, and a responsive frontend.', array['Laravel','MySQL','REST'],238),
  (2,'03','Web apps','Blog · Timetable ·','Training','Three production-shaped applications built with Laravel, React, and SQL databases, with clean schema design, CRUD APIs, and authentication flows.', array['React','Laravel','Auth'],208),
  (3,'04','Fundamentals','Snake','game','A classic Snake implementation focused on game logic and state management, a deliberate fundamentals exercise for reinforcing data structures and algorithmic thinking.', array['JS','State','Algorithms'],252),
  (4,'05','Systems','Enterprise','infra ops','Hands-on administration of servers, networks, and storage during my Durga role: patching, configuration, and uptime monitoring at production scale.', array['Linux','Networking','Storage'],200);
end if;

if not exists (select 1 from public.experience_roles) then
  insert into public.experience_roles (sort_order, period, tag, title, org, note, is_current, bullets) values
  (0,'Dec 2023 — Nov 2024','Now','Customer Support & Receptionist','Advocate Office — London','Multilingual (EN · PT · HI · NE)', true, array[
    'Managed GDPR-compliant client records with zero data-protection incidents, via structured digital records, access controls, and weekly intake audits.',
    'Standardized a multilingual client-to-government workflow, cutting average case turnaround through live interpretation and reusable response templates.',
    'Accelerated front-desk throughput with a centralized scheduling log and prioritization rules for walk-in vs. booked clients.']),
  (1,'Sep 2022 — Nov 2023','2023','Customer Service Representative','Cluster', null, false, array[
    'Exceeded monthly response-time and CSAT KPIs by prioritizing high-impact tickets and following structured escalation paths.',
    'Documented an issue-resolution playbook across product categories with cross-functional teams, reducing average handle time.',
    'Delivered technical product support across daily contacts with empathetic, structured communication.']),
  (2,'2021','2021','Web Developer','Durga', null, false, array[
    'Designed relational schemas with Laravel ORM — normalizing tables, indexing key columns, and rewriting inefficient SQL queries.',
    'Built scalable Laravel (MVC) web applications, translating business requirements into structured backend logic and reusable components.',
    'Administered servers, networks, and storage — configuration, patching, and uptime monitoring at production scale.']),
  (3,'2017','2017','Customer Support Representative','Tulsi', null, false, array[
    'Resolved customer inquiries via email and chat within agreed SLAs using structured troubleshooting.',
    'Documented recurring issues into the internal FAQ and knowledge base, reducing repeat tickets.']),
  (4,'2018 — 2023','BSc','BSc Informatics Engineering','IPB — Polytechnic Institute of Bragança, Portugal', null, false, array[
    'Coursework: Databases, Algorithms & Data Structures, Statistics, Machine Learning, Software Engineering, OOP.']);
end if;

if not exists (select 1 from public.skill_blocks) then
  insert into public.skill_blocks (sort_order, title, tags) values
  (0,'Data & Analysis', array['SQL','Python','Pandas','NumPy','scikit-learn','ETL','EDA','A/B Testing']),
  (1,'Visualization', array['Matplotlib','Seaborn','Power BI','Tableau','Excel · PivotTables']),
  (2,'Databases & Engineering', array['PostgreSQL','MySQL','Schema Design','Query Optimization','Laravel ORM','Git']),
  (3,'Workflow & Soft Skills', array['JIRA','Agile','GDPR','Stakeholder Comms','Multilingual']);
end if;
end $$;

-- =====================================================================
-- STEP 2 — RUN ONLY AFTER creating your login
--   (Supabase Dashboard -> Authentication -> Users -> Add user).
--
--   -- a) ensure every auth user has a profile row:
--   insert into public.profiles (id, email)
--   select id, email from auth.users on conflict (id) do nothing;
--
--   -- b) promote yourself to admin BY ID (email is editable, so never by email):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'dibesoli@gmail.com' limit 1);
--
--   -- c) verify (your row should show role = admin):
--   select id, email, role from public.profiles;
-- =====================================================================
