-- =============================================================
-- NOTE - Supabase schema for dictionary, themes and suggestion engine
-- =============================================================

create extension if not exists pgcrypto;

-- 1) Themes
create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- 2) Words
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  lemma text,
  category text not null default 'noun',
  theme_id uuid references public.themes(id) on delete set null,
  genre text not null default 'general',
  tone text not null default 'neutral',
  emotional_tag text not null default 'neutral',
  style text not null default 'general',
  weight numeric not null default 1,
  created_at timestamptz not null default now()
);

-- 3) Phrase templates
create table if not exists public.phrase_templates (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  theme_id uuid references public.themes(id) on delete set null,
  genre text not null default 'general',
  style text not null default 'general',
  purpose text not null default 'narrative',
  weight numeric not null default 1,
  created_at timestamptz not null default now()
);

-- 4) User preferences
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  preferred_theme text,
  preferred_genre text,
  preferred_style text,
  created_at timestamptz not null default now()
);

-- 5) Example themes
insert into public.themes (name, description)
values
  ('nature', 'Mots liés au paysage, aux éléments naturels et à la sensation de calme ou de mystère.'),
  ('amour', 'Mots et expressions autour des sentiments, de la tension romantique et des relations.'),
  ('mystere', 'Mots associés au secret, à l’intrigue, au suspense et aux révélations.'),
  ('fantastique', 'Mots pour un univers imaginaire, surnaturel, mythique et enchanteur.'),
  ('science_fiction', 'Mots de technologie, futur, espace, machine et évolution.'),
  ('guerre', 'Mots pour le conflit, la violence, le courage et la bataille.'),
  ('ville', 'Mots urbains, architecture, rues, bruit et rythme de la cité.'),
  ('memoire', 'Mots liés au souvenir, au passé, à l’émotion et à la trace.'),
  ('poesie', 'Mots et images pour un style plus musical, visuel et émotionnel.'),
  ('discours', 'Mots utiles pour convaincre, exposer, expliquer ou orienter une idée.')
on conflict (name) do nothing;

-- 6) Example words for a few themes
insert into public.words (word, lemma, category, theme_id, genre, tone, emotional_tag, style, weight)
select * from (
  values
    ('mer', 'mer', 'noun', (select id from public.themes where name = 'nature'), 'poetic', 'calm', 'serene', 'lyrical', 1.2),
    ('lune', 'lune', 'noun', (select id from public.themes where name = 'nature'), 'poetic', 'mystic', 'dreamy', 'lyrical', 1.4),
    ('brume', 'brume', 'noun', (select id from public.themes where name = 'nature'), 'mystical', 'dark', 'mysterious', 'poetic', 1.5),
    ('vent', 'vent', 'noun', (select id from public.themes where name = 'nature'), 'general', 'dynamic', 'restless', 'narrative', 1.3),
    ('pluie', 'pluie', 'noun', (select id from public.themes where name = 'nature'), 'poetic', 'melancholic', 'sad', 'lyrical', 1.6),
    ('silence', 'silence', 'noun', (select id from public.themes where name = 'nature'), 'mystical', 'tense', 'mysterious', 'poetic', 1.7),

    ('coeur', 'coeur', 'noun', (select id from public.themes where name = 'amour'), 'romantic', 'warm', 'loving', 'lyrical', 1.8),
    ('promesse', 'promesse', 'noun', (select id from public.themes where name = 'amour'), 'romantic', 'soft', 'hopeful', 'narrative', 1.5),
    ('tendre', 'tendre', 'adj', (select id from public.themes where name = 'amour'), 'romantic', 'gentle', 'loving', 'lyrical', 1.6),
    ('souvenir', 'souvenir', 'noun', (select id from public.themes where name = 'memoire'), 'dramatic', 'nostalgic', 'reflective', 'narrative', 1.5),
    ('ombre', 'ombre', 'noun', (select id from public.themes where name = 'mystere'), 'mystical', 'dark', 'suspenseful', 'poetic', 1.7),
    ('secret', 'secret', 'noun', (select id from public.themes where name = 'mystere'), 'mystical', 'tense', 'curious', 'narrative', 1.8),
    ('porte', 'porte', 'noun', (select id from public.themes where name = 'fantastique'), 'fantasy', 'mystic', 'magical', 'narrative', 1.5),
    ('magie', 'magie', 'noun', (select id from public.themes where name = 'fantastique'), 'fantasy', 'wonderful', 'dreamy', 'lyrical', 1.9),
    ('etoile', 'etoile', 'noun', (select id from public.themes where name = 'fantastique'), 'fantasy', 'dreamy', 'wonderful', 'poetic', 1.6),
    ('vaisseau', 'vaisseau', 'noun', (select id from public.themes where name = 'science_fiction'), 'sci_fi', 'futuristic', 'curious', 'narrative', 1.8),
    ('orbitale', 'orbitale', 'adj', (select id from public.themes where name = 'science_fiction'), 'sci_fi', 'cold', 'futuristic', 'descriptive', 1.4),
    ('bataille', 'bataille', 'noun', (select id from public.themes where name = 'guerre'), 'epic', 'violent', 'intense', 'narrative', 1.7),
    ('frontiere', 'frontiere', 'noun', (select id from public.themes where name = 'guerre'), 'epic', 'tense', 'resolute', 'narrative', 1.5),
    ('rue', 'rue', 'noun', (select id from public.themes where name = 'ville'), 'realist', 'lively', 'urban', 'descriptive', 1.5),
    ('fenetre', 'fenetre', 'noun', (select id from public.themes where name = 'ville'), 'realist', 'quiet', 'reflective', 'narrative', 1.3),
    ('convaincre', 'convaincre', 'verb', (select id from public.themes where name = 'discours'), 'argumentative', 'direct', 'persuasive', 'persuasive', 1.7),
    ('preuve', 'preuve', 'noun', (select id from public.themes where name = 'discours'), 'argumentative', 'clear', 'rational', 'analytical', 1.8),
    ('raison', 'raison', 'noun', (select id from public.themes where name = 'discours'), 'argumentative', 'calm', 'logical', 'analytical', 1.7)
) as v(word, lemma, category, theme_id, genre, tone, emotional_tag, style, weight)
where v.theme_id is not null;

-- 7) Example phrase templates
insert into public.phrase_templates (text, theme_id, genre, style, purpose, weight)
select * from (
  values
    ('La lune se reflétait dans l’eau comme un secret encore vivant.', (select id from public.themes where name = 'nature'), 'poetic', 'lyrical', 'narrative', 1.8),
    ('Le vent passait dans la brume comme une promesse qu’on n’osait pas entendre.', (select id from public.themes where name = 'nature'), 'poetic', 'lyrical', 'narrative', 1.7),
    ('Sous le silence, le cœur entendait déjà la vérité qu’il refusait encore.', (select id from public.themes where name = 'amour'), 'romantic', 'lyrical', 'narrative', 1.8),
    ('La promesse restait suspendue dans l’air, plus forte que le doute.', (select id from public.themes where name = 'amour'), 'romantic', 'narrative', 'narrative', 1.7),
    ('Il y avait un secret dans cette pièce, et chacun le portait sans le nommer.', (select id from public.themes where name = 'mystere'), 'mystical', 'narrative', 'narrative', 1.9),
    ('L’ombre ne bougea pas, mais le silence changea de couleur.', (select id from public.themes where name = 'mystere'), 'mystical', 'poetic', 'narrative', 1.8),
    ('La magie ne se montra pas dans la violence, mais dans le calme qui suivit.', (select id from public.themes where name = 'fantastique'), 'fantasy', 'lyrical', 'narrative', 1.8),
    ('Le portail ouvrit une lumière si douce que la peur se transforma en attente.', (select id from public.themes where name = 'fantastique'), 'fantasy', 'lyrical', 'narrative', 1.7),
    ('Le vaisseau traversa l’orbite avec une précision presque humaine.', (select id from public.themes where name = 'science_fiction'), 'sci_fi', 'descriptive', 'narrative', 1.8),
    ('La preuve était simple, mais elle enfonçait le doute dans chaque certitude.', (select id from public.themes where name = 'discours'), 'argumentative', 'analytical', 'persuasive', 1.8)
) as v(text, theme_id, genre, style, purpose, weight)
where v.theme_id is not null;

-- 8) Basic RLS setup
alter table public.themes enable row level security;
alter table public.words enable row level security;
alter table public.phrase_templates enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists "Themes are readable by anyone" on public.themes;
drop policy if exists "Words are readable by anyone" on public.words;
drop policy if exists "Templates are readable by anyone" on public.phrase_templates;
drop policy if exists "Users can read own preferences" on public.user_preferences;
drop policy if exists "Users can update own preferences" on public.user_preferences;
drop policy if exists "Users can insert own preferences" on public.user_preferences;

create policy "Themes are readable by anyone"
on public.themes
for select
using (true);

create policy "Words are readable by anyone"
on public.words
for select
using (true);

create policy "Templates are readable by anyone"
on public.phrase_templates
for select
using (true);

create policy "Users can read own preferences"
on public.user_preferences
for select
using (auth.uid() = user_id);

create policy "Users can update own preferences"
on public.user_preferences
for update
using (auth.uid() = user_id);

create policy "Users can insert own preferences"
on public.user_preferences
for insert
with check (auth.uid() = user_id);

-- 9) Quick query to verify the content
-- select * from public.themes order by name;
-- select * from public.words order by theme_id, weight desc limit 20;
-- select * from public.phrase_templates order by weight desc limit 10;
