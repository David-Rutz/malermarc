-- TABELLE: content (alle Texte & Kontaktdaten als Key-Value)
create table if not exists content (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text,
  updated_at timestamp default now()
);

-- TABELLE: projekte (Referenzprojekte)
create table if not exists projekte (
  id uuid default gen_random_uuid() primary key,
  titel text not null,
  beschreibung text,
  kategorie text,
  bild_vorher text,
  bild_nachher text,
  reihenfolge int default 0,
  aktiv boolean default true,
  created_at timestamp default now()
);

-- TABELLE: faq
create table if not exists faq (
  id uuid default gen_random_uuid() primary key,
  frage text not null,
  antwort text not null,
  reihenfolge int default 0,
  aktiv boolean default true
);

-- ROW LEVEL SECURITY aktivieren
alter table content enable row level security;
alter table projekte enable row level security;
alter table faq enable row level security;

-- Öffentlich lesen
create policy "public read content" on content for select using (true);
create policy "public read projekte" on projekte for select using (true);
create policy "public read faq" on faq for select using (true);

-- Nur eingeloggte User dürfen schreiben
create policy "auth write content" on content for all using (auth.role() = 'authenticated');
create policy "auth write projekte" on projekte for all using (auth.role() = 'authenticated');
create policy "auth write faq" on faq for all using (auth.role() = 'authenticated');

-- START-DATEN für content einfügen
insert into content (key, value) values
  ('hero_titel', 'Farbe. Qualität. Handwerk.'),
  ('hero_sub', 'MalerMarc verwandelt Räume in Erlebnisse. Innen- und Aussenmalerei, Wandgestaltung und Gipserarbeiten – ausgeführt mit Präzision und Leidenschaft.'),
  ('ueber_titel', 'Hallo, ich bin Marc.'),
  ('ueber_text', 'Was als Neugier für Farben begann, wurde zur Berufung. Seit über 20 Jahren verwandle ich kahle Wände in Erlebnisse.'),
  ('kontakt_telefon', '+41 XX XXX XX XX'),
  ('kontakt_email', 'info@malermarc.ch'),
  ('kontakt_adresse', 'Musterstrasse 1, 3000 Bern'),
  ('kontakt_zeiten', 'Mo–Fr, 07:00–17:00 Uhr'),
  ('stat_projekte', '200+'),
  ('stat_jahre', '20+')
on conflict (key) do nothing;

-- STORAGE BUCKET für Bilder
insert into storage.buckets (id, name, public)
values ('bilder', 'bilder', true)
on conflict do nothing;

-- Storage Policy: öffentlich lesen
create policy "public read bilder" on storage.objects
  for select using (bucket_id = 'bilder');

-- Storage Policy: nur auth hochladen
create policy "auth upload bilder" on storage.objects
  for insert with check (bucket_id = 'bilder' and auth.role() = 'authenticated');

create policy "auth delete bilder" on storage.objects
  for delete using (bucket_id = 'bilder' and auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════
-- DEBUGGING: Falls Bilder nicht angezeigt werden
-- Diese Abfragen im Supabase SQL Editor ausführen
-- ══════════════════════════════════════════════════════════

-- 1. Prüfen ob Storage Policies korrekt gesetzt sind:
-- select * from storage.policies where bucket_id = 'bilder';

-- 2. Prüfen ob Bucket auf "public" gesetzt ist:
-- select id, name, public from storage.buckets where id = 'bilder';

-- 3. Bucket auf public setzen (falls false):
-- update storage.buckets set public = true where id = 'bilder';

-- 4. Falls "public read bilder" Policy fehlt, neu erstellen:
-- create policy "public read bilder" on storage.objects
--   for select using (bucket_id = 'bilder');

-- 5. Gespeicherte Bild-URLs in content-Tabelle prüfen:
-- select key, value, updated_at from content
--   where value like 'https://%.supabase.co/storage%'
--   order by updated_at desc;

-- 6. Alle content-Einträge anzeigen:
-- select key, left(value, 80) as value_preview, updated_at from content order by key;

-- 7. Falls Policies vorhanden aber Bucket nicht public, alle 3 Policies neu:
-- drop policy if exists "public read bilder" on storage.objects;
-- create policy "public read bilder" on storage.objects
--   for select using (bucket_id = 'bilder');
-- update storage.buckets set public = true where id = 'bilder';

-- ERWARTETES URL-FORMAT für korrekte Bild-URLs:
-- https://zfyesnrezqupxolslbgx.supabase.co/storage/v1/object/public/bilder/DATEINAME
