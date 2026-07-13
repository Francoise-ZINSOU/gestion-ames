# Gestion des Âmes — Suivi Pastoral

Application de gestion pastorale pour le suivi individualisé des membres d'une église.

**Démo en production** : [suivi-enracinees.netlify.app](https://suivi-enracinees.netlify.app)

## Fonctionnalités

### Présences
- Saisie par activité (Culte, Enseignement, Prière) avec grille de coches
- Complétion partielle — revenir plus tard sans perdre les données
- Suppression d'une date entière avec confirmation
- Blocage des dates futures
- Détection de conflit multi-utilisateurs
- Éligibilité automatique (inscription, départ/retour)

### Suivi des Âmes
- Fiche 360° avec 5 onglets : Identité, Présences, Entretiens, Défis, Plan
- CRUD complet (ajout, modification, archivage)
- Validation email/téléphone + détection de doublons
- Import CSV avec prévisualisation et détection des doublons
- Archivage avec réassignation automatique des suivis
- Rétrogradation de rôle avec réassignation
- Historique des changements de statut

### Entretiens
- Création depuis la fiche membre ou la page globale
- Dropdowns avec qui + sujets de référence
- Statuts : Planifié, Réalisé, Annulé
- Alerte sur les entretiens planifiés en retard

### Défis & Plan de croissance
- Défis avec cycle de vie : Identifié → En cours → Résolu
- Modification et suppression des défis
- Modules de croissance liés à un défi
- Multi-sélection de modules à assigner
- Barre de progression par défi
- Suggestion automatique "Passer en Résolu" quand tous les modules sont validés

### Alertes croisées
- Score de sévérité combinant : absences consécutives + jours sans entretien + défis ouverts
- Seuils configurables en base de données
- Berger principal exclu des alertes
- Entretiens planifiés en retard signalés

### Dashboard
- KPIs : total actifs, nouveaux, intégrés, taux culte global
- Notifications : membres "Nouveau" depuis 3+ mois, défis sans module
- Lien direct vers les alertes
- Inscriptions récentes cliquables

### Arbre de suivi
- Hiérarchie : Berger principal → Piliers → Membres
- Piliers sans berger affichés avec leurs suivis
- Membres orphelins identifiés
- KPIs : nombre de bergers, piliers, sans suiveur

### Administration
- 9 tables de référence configurables (statuts, rôles, activités, modules, sujets...)
- Gestion des utilisateurs (Responsable / Admin)
- Export 4 CSV (membres, présences, entretiens, défis)
- Réinitialisation des données avec confirmation

## Architecture

```
src/
├── main.jsx                    # Point d'entrée React
├── App.jsx                     # Orchestrateur (routing + data hooks)
├── lib/
│   ├── supabase.js             # Client Supabase
│   ├── auth.jsx                # Authentification + 3 niveaux d'accès
│   ├── data.js                 # Hooks de données (CRUD, realtime, vues SQL)
│   └── ui.jsx                  # Styles partagés, formatage, toast
├── components/
│   └── Layout.jsx              # Sidebar Lucide + header + nav mobile
└── pages/
    ├── Login.jsx               # Connexion / inscription
    ├── AccessDenied.jsx        # Accès refusé (membre non responsable)
    ├── MenuMobile.jsx          # Menu complet mobile
    ├── Home.jsx                # Dashboard + KPIs + notifications
    ├── Presences.jsx           # Grille de saisie
    ├── Ames.jsx                # Liste des membres + import CSV
    ├── Fiche.jsx               # Fiche 360° (5 onglets)
    ├── Alertes.jsx             # Alertes croisées
    ├── EntretiensGlobal.jsx    # Vue globale + création
    ├── Croissance.jsx          # Avancement des plans
    ├── Historique.jsx          # Graphique barres + tableau
    ├── Filiation.jsx           # Arbre de suivi
    ├── Export.jsx              # Export CSV + réinitialisation
    └── Params.jsx              # Paramètres admin
```

## Stack technique

- **Frontend** : React 18 + Vite + Lucide React (icônes)
- **Backend** : Supabase (PostgreSQL + Auth + Realtime + RLS)
- **Hébergement** : Netlify (frontend) + Supabase (backend)
- **Coût** : Gratuit (tier gratuit Supabase + Netlify)

## Installation

### 1. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. SQL Editor → exécuter `supabase-schema.sql`
3. SQL Editor → exécuter `evolution-v1.1.sql` (seuils configurables)
4. Settings → API → copier Project URL + anon key

### 2. Déploiement Netlify

1. Pousser le code sur GitHub
2. Netlify → Add new site → Import from Git → GitHub
3. Build command : `npm run build`
4. Publish directory : `dist`
5. Variables d'environnement :
   - `VITE_SUPABASE_URL` → URL du projet Supabase
   - `VITE_SUPABASE_ANON_KEY` → clé anon publique
6. Deploy

### 3. Premier admin

1. S'inscrire sur l'app
2. Dans Supabase SQL Editor :
```sql
-- Désactiver les protections temporairement
DROP TRIGGER IF EXISTS trg_protect_profil ON public.profils;
ALTER TABLE public.profils DISABLE ROW LEVEL SECURITY;

UPDATE public.profils
SET est_admin = true, est_responsable = true
WHERE email = 'votre-email@ici.com';

ALTER TABLE public.profils ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_protect_profil
  BEFORE UPDATE ON public.profils
  FOR EACH ROW EXECUTE FUNCTION protect_profil_fields();
```

## Niveaux d'accès

| Rôle | Données pastorales | Paramètres |
|------|-------------------|------------|
| Membre connecté | ❌ Page "Accès restreint" | ❌ |
| Responsable | ✅ Toutes les pages | ❌ |
| Admin | ✅ Toutes les pages | ✅ Paramètres + utilisateurs |

## Hiérarchie pastorale

```
Berger principal (niveau 0)
  └── Pilier (niveau 1, peut suivre)
        └── Membre (niveau 2)
```

- Le Berger principal n'a pas de "Suivi par" et est exclu des alertes
- Un Pilier peut suivre un autre Pilier
- Un seul Berger principal autorisé par église
