# Gestion des Âmes — Suivi Pastoral

Application de gestion pastorale d'église pour le suivi individualisé des membres.

## Architecture

```
src/
├── main.jsx                    # Point d'entrée React
├── App.jsx                     # Orchestrateur principal (routing + data hooks)
├── lib/
│   ├── supabase.js             # Client Supabase
│   ├── auth.jsx                # Contexte d'authentification
│   ├── data.js                 # Hooks de données (CRUD, realtime, vues)
│   └── ui.jsx                  # Styles partagés, formatage, toast
├── components/
│   └── Layout.jsx              # Sidebar + header + nav mobile
└── pages/
    ├── Login.jsx               # Page de connexion
    ├── AccessDenied.jsx        # Accès refusé (membre non responsable)
    ├── MenuMobile.jsx          # Menu complet pour mobile
    ├── Home.jsx                # Dashboard + KPIs
    ├── Presences.jsx           # Grille de saisie ✅ COMPLET
    ├── Ames.jsx                # Liste des membres ✅ COMPLET
    ├── Fiche.jsx               # Fiche 360° (à compléter depuis prototype)
    ├── Alertes.jsx             # Alertes croisées (à compléter)
    ├── EntretiensGlobal.jsx    # Vue globale entretiens (à compléter)
    ├── Croissance.jsx          # Plan de croissance (à compléter)
    ├── Historique.jsx          # Timeline (à compléter)
    ├── Filiation.jsx           # Arbre de suivi (à compléter)
    ├── Export.jsx              # Export CSV (à compléter)
    └── Params.jsx              # Paramètres admin (à compléter)
```

## Installation

### 1. Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → New project
2. Copier l'URL et la clé Anon depuis Settings > API
3. Ouvrir le SQL Editor
4. Coller et exécuter le contenu de `supabase-schema.sql`

### 2. Configurer l'application

```bash
# Cloner et installer
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase
```

### 3. Créer le premier admin

1. Lancer l'app (`npm run dev`)
2. Créer un compte via la page d'inscription
3. Confirmer l'email (vérifier les spams)
4. Dans Supabase SQL Editor, exécuter :
```sql
UPDATE profils 
SET est_admin = TRUE, est_responsable = TRUE
WHERE email = 'votre-email@eglise.com';
```

### 4. Lancer en développement

```bash
npm run dev
```

### 5. Déployer sur Vercel

```bash
# Option A : via CLI
npx vercel

# Option B : via l'interface Vercel
# 1. Connecter le repo GitHub
# 2. Ajouter les variables d'environnement :
#    VITE_SUPABASE_URL
#    VITE_SUPABASE_ANON_KEY
# 3. Deploy
```

## Niveaux d'accès

| Rôle | Données pastorales | Paramètres |
|------|-------------------|------------|
| Membre connecté | ❌ | ❌ |
| Responsable (Berger/Pilier) | ✅ | ❌ |
| Admin | ✅ | ✅ |

## Pages à compléter

Les pages suivantes sont des stubs connectés aux hooks Supabase.
La logique UI complète existe dans le prototype `gestion-ames-v6.jsx` (clé `eglise-v8`).

Pour chaque page, copier la logique du prototype en remplaçant :
- `D.mb` → `props.membres` ou `props.actifs`
- `D.pr` → `props.presences`
- `D.en` → `props.entretiens`
- `D.df` → `props.defis`
- `D.pt` → `props.plans`
- `persist({...})` → appeler le hook CRUD correspondant (ex: `props.ajouterEnt(...)`)
- `STATUTS` / `ROLES` → `props.refs.statuts` / `props.refs.roles`
- Champs DB renommés : `di` → `date_inscription`, `suiviPar` → `suivi_par`, etc.

## Stack technique

- **Frontend** : React 18 + Vite
- **Backend** : Supabase (PostgreSQL + Auth + Realtime + RLS)
- **Hébergement** : Vercel (frontend) + Supabase (backend)
- **Coût** : Gratuit (tier gratuit Supabase + Vercel)
