# Suivi Tournois Golf - Tom Martin

Application de suivi des tournois de golf (planning, logistique, budget).

## Comptes utilisateurs (nouveau)

L'application utilise maintenant de vrais comptes (email + mot de passe), avec une base de
données en ligne gratuite (Supabase). Chaque personne qui crée un compte ne voit que ses
propres tournois, son propre sac, et ses propres réglages — tes données ne sont jamais
mélangées avec celles des autres.

Si tu changes d'ordinateur ou de navigateur, connecte-toi simplement avec ton compte : tout
est déjà là.

**Configuration déjà faite pour toi** dans `src/supabaseClient.js` (URL + clé publique du
projet). Si un jour tu veux créer ton propre projet Supabase séparé, remplace ces deux valeurs
et exécute le script `supabase-setup.sql` (fourni à côté de ce README) dans l'éditeur SQL de
ton nouveau projet Supabase pour recréer les tables.

## Nouveautés : carte et calcul de trajet

- Renseigne ton adresse de domicile via l'icône ⚙️ en haut à droite (bouton "Localiser" pour la géolocaliser)
- Renseigne le prix actuel du carburant et la consommation de ton véhicule dans les mêmes réglages
- Dans le formulaire d'un tournoi, clique sur "Localiser et calculer la distance" : la distance, le coût
  aller-retour en voiture, et une estimation des péages se calculent automatiquement (tu peux toujours ajuster
  les montants à la main ensuite — les péages sont une estimation moyenne, pas un tarif exact)
- Une carte apparaît en bas de la page avec tous les tournois localisés et ton domicile

Le géocodage et le calcul d'itinéraire utilisent des services gratuits et sans clé API
(OpenStreetMap Nominatim et OSRM). Ils peuvent être temporairement lents ou indisponibles ;
dans ce cas, réessaie dans quelques instants.

## Utiliser en local

```
npm install
npm run dev
```

Ouvre ensuite l'adresse affichée dans le terminal (en général http://localhost:5173).

## Mettre en ligne gratuitement (recommandé : Netlify)

1. Va sur https://app.netlify.com et crée un compte gratuit (avec ton email ou GitHub).
2. Clique sur "Add new site" > "Deploy manually".
3. Sur ton ordinateur, lance `npm install` puis `npm run build` dans ce dossier.
   Cela crée un dossier `dist/`.
4. Glisse-dépose le dossier `dist/` dans la zone de dépôt Netlify.
5. Netlify te donne une adresse en quelques secondes (ex: tonprojet.netlify.app).
   Tu peux ensuite la personnaliser (ex: suivi-tom-golf.netlify.app) dans les
   paramètres du site, gratuitement.

## Alternative : Vercel (mise à jour automatique via GitHub)

1. Mets ce dossier sur un dépôt GitHub (crée un compte gratuit sur github.com si besoin).
2. Va sur https://vercel.com, connecte-toi avec ton compte GitHub.
3. "Add New Project" > sélectionne ton dépôt > Deploy.
   Vercel détecte automatiquement Vite/React, aucune configuration nécessaire.
4. À chaque fois que tu modifies le code sur GitHub, le site se met à jour tout seul.

## Important à savoir sur les données

Les données (tes tournois) sont stockées dans le navigateur (localStorage), sur
l'appareil que tu utilises. Si tu changes d'ordinateur ou de navigateur, tu ne
retrouveras pas automatiquement tes données. Pour un usage perso sur un seul
appareil, c'est largement suffisant.
