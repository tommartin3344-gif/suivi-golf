-- Table des tournois
create table tournois (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  nom text not null,
  club text,
  ville text,
  date_debut date not null,
  date_fin date,
  date_limite_inscription date,
  statut text default 'a_faire',
  notes text,
  transport_mode text default 'voiture',
  cout_transport numeric default 0,
  cout_peage numeric default 0,
  cout_inscription numeric default 0,
  cout_logement numeric default 0,
  lat double precision,
  lng double precision,
  distance_km double precision,
  duree_min double precision,
  created_at timestamptz default now()
);

-- Table de l'inventaire (sac de golf)
create table inventaire (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  nom text not null,
  categorie text default 'autre',
  quantite numeric default 1,
  prix_unitaire numeric default 0,
  date_achat date,
  notes text,
  created_at timestamptz default now()
);

-- Table des réglages (un seul enregistrement par utilisateur)
create table parametres (
  user_id uuid primary key references auth.users not null default auth.uid(),
  adresse_domicile text,
  domicile_lat double precision,
  domicile_lng double precision,
  prix_carburant numeric default 1.85,
  consommation numeric default 7
);

-- Activer la sécurité par ligne (chacun ne voit que ses propres données)
alter table tournois enable row level security;
alter table inventaire enable row level security;
alter table parametres enable row level security;

create policy "Chacun gère ses propres tournois" on tournois
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Chacun gère son propre inventaire" on inventaire
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Chacun gère ses propres paramètres" on parametres
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
