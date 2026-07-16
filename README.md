# Gestion des Âmes — Suivi Pastoral

Application web de gestion pastorale pour le suivi individualisé des membres d'une église.

**Production** : https://suivi-enracinees.netlify.app

---

## Stack technique

- **Frontend** : React 18 + Vite
- **Backend** : Supabase (PostgreSQL + Auth + Realtime + Row-Level Security)
- **Hébergement** : Netlify (auto-deploy depuis GitHub)
- **Polices** : DM Sans (corps), Outfit (titres), Roboto Mono (code)
- **Icônes** : Lucide React

---

## Architecture

```
src/
├── main.jsx                    Point d'entrée
├── App.jsx                     Orchestrateur, hooks data, routing
├── lib/
│   ├── supabase.js            Client Supabase
│   ├── auth.jsx               Contexte auth (login/profil/rôles)
│   ├── data.js                Hooks : useMembres, usePresences, useEntretiens, useDefis, usePlanCroissance, useAlertes, useRefs, useDatesAnnulees, useJournal, useHistoriqueStatuts, useProfils, refHelpers, resetAllData
│   └── ui.jsx                 Styles S, formatters fmt/fmtS/dago/dagoLabel, Toast
├── components/
│   └── Layout.jsx             Sidebar desktop + nav mobile + header
└── pages/
    ├── Login.jsx              Connexion
    ├── AccessDenied.jsx       Accès refusé
    ├── NoFamille.jsx          Utilisateur sans famille assignée
    ├── MenuMobile.jsx         Menu "Plus" mobile
    ├── Home.jsx               Dashboard (KPIs, notifications, quick actions)
    ├── Presences.jsx          Saisie des présences par activité/date
    ├── Ames.jsx               Liste + création + import CSV + actions en masse
    ├── Fiche.jsx              Fiche 360° (6 onglets : Identité, Présences, Entretiens, Défis, Plan, Journal)
    ├── Alertes.jsx            Alertes de suivi avec détail du score
    ├── EntretiensGlobal.jsx   Vue globale des entretiens
    ├── Croissance.jsx         Plan de croissance
    ├── Historique.jsx         Graphique + tableau présences par activité
    ├── Filiation.jsx          Arbre de suivi récursif
    ├── Export.jsx             Export CSV + reset données
    ├── Params.jsx             Paramètres (Références, Utilisateurs, Église)
    └── VueEglise.jsx          Vue macro multi-familles (Berger d'église)
```

---

## Fonctionnalités principales

### Gestion des membres
- CRUD complet, import CSV (auto-détection UTF-8/windows-1252)
- Actions en masse (changer statut, assigner à un pilier)
- Archivage réversible
- Historique des statuts
- Transfert intelligent entre familles
- Filtres : rôle, statut, "Mes suivis" (basé sur profil ↔ membre)
- Cartes sur mobile, tableau sur desktop

### Saisie des présences
- Par activité (Culte, Enseignement, Prière, etc.)
- Boutons "Tous" / "Aucun"
- Dates annulées (les absences ne comptent pas)
- Barre "Enregistrer" sticky en bas
- Conflit multi-utilisateur détecté

### Fiche 360°
- 6 onglets : Identité, Présences, Entretiens, Défis, Plan de croissance, Journal pastoral
- Menu "⋯ Actions" : Modifier / Archiver / Transférer (admin)
- Bouton retour contextuel (← Alertes / ← Liste / ← Entretiens / ← Accueil)
- KPIs : jours depuis inscription, absences consécutives, entretiens, plan validé
- Suggestion "Passer en Résolu" quand tous les modules d'un défi sont validés

### Alertes de suivi
- Score = absences (3pts) + jours sans entretien (2pts) + défis ouverts (1pt)
- Détail par pill coloré : "3 abs. consécutives (+3) · 25j sans entretien (+2)"
- Seuils configurables via `ref_parametres`
- Filtrage intelligent : les membres avec un entretien planifié dans les 30 prochains jours sont masqués (le pilier a pris en charge)

### Désactivation églises et familles
- Soft-delete via `actif = false` (préserve l'historique)
- Cascade automatique : désactiver une église → désactive ses familles
- Réactivation manuelle des familles (pour éviter surprises)
- Bandeau "Famille désactivée" affiché aux utilisateurs concernés
- Données consultables mais alertes/détections gelées

### Entretiens
- Création depuis la Fiche ou la page globale
- Filtre "Avec qui" = uniquement Bergers + Piliers (peut_suivre)
- Détection des entretiens planifiés en retard
- Pagination "Voir plus" (30 par batch)

### Plan de croissance
- Modules liés à des défis via `defi_id`
- Suivi individuel + collectif

### Filiation
- Arbre récursif (Berger → Pilier → Pilier → Membre)
- Piliers non rattachés = signal d'anomalie
- Membres sans suiveur affichés séparément

### Multi-église
- Table `eglises` + `familles_disciples`
- `famille_id` sur toutes les données
- RLS filtrant automatiquement par famille
- Super-admin bypass
- Trigger auto-set du `famille_id` à l'insertion

### Berger d'église (vue macro)
- Nouvelle page "Vue église"
- Accès en lecture seule à toutes les familles de son église
- 4 KPIs : total actifs, taux culte moyen (4 dernières sem), nouveaux 30j, familles à risque
- 2 sections critiques : familles < 80% au dernier dimanche + familles en baisse de -10 pts
- Comparatif par famille : culte 4sem, tendance, dim dernier, nouveaux, entretiens

### Journal pastoral (6ème onglet Fiche)
- Notes libres, appels, visites, SMS, observations
- Timeline chronologique

### Anniversaires
- Champ `date_naissance`
- Notification dashboard : "3 anniversaires cette semaine : Marina, David, Careine"

### Détection de tendances
- Présence en baisse : 3+/4 dimanches passés vs 0-1/4 récents → alerte préventive

### Détection des dates manquantes
- Activités récurrentes : chaque activité peut avoir un jour de la semaine (`jour_semaine`)
- Historique : 3 états visuels distincts (saisie / annulée / non saisie)
- Dashboard : notification "X culte(s) non saisi(s) sur les 30 derniers jours" 

### PWA
- Installable sur écran d'accueil (mobile + desktop)
- Icône dédiée, plein écran, theme-color

---

## Rôles & permissions

| Rôle | Peut... |
|---|---|
| **Membre** (par défaut) | Aucun accès à l'app |
| **Responsable** (`est_responsable`) | Lire et modifier les données de sa famille |
| **Admin** (`est_admin`) | + Modifier les tables de référence, gérer les utilisateurs |
| **Berger d'église** (`est_berger_eglise`) | + Lire toutes les familles de son église (page "Vue église") |
| **Super-admin** (`est_super_admin`) | + Bypass RLS, accès total |

Un utilisateur peut cumuler plusieurs rôles.

---

## Base de données

### Tables principales
- `membres` : les âmes suivies
- `presences` : présences par membre/activité/date
- `entretiens` : entretiens pastoraux
- `defis` : défis à surmonter
- `plan_croissance` : modules assignés/validés
- `historique_statuts` : trace des changements de statut
- `journal_pastoral` : notes libres
- `dates_annulees` : dates où les absences ne comptent pas

### Tables de référence
- `ref_roles` : Berger principal / Pilier / Membre
- `ref_statuts` : Nouveau / STAR / Intégré / En difficulté / Archivé
- `ref_statuts_defi`, `ref_statuts_entretien`
- `ref_sujets_entretien`, `ref_types_defi`
- `activites` : Culte, Enseignement, Prière, etc. (par famille)
- `modules` : modules du plan de croissance
- `ref_parametres` : seuils configurables

### Multi-tenant
- `eglises` : églises
- `familles_disciples` : familles au sein d'une église
- `famille_id` sur toutes les tables de données
- `profils` : lié à `auth.users`, contient `famille_id`, `eglise_id`, `membre_id`, flags de rôles

---

## Migrations SQL

Les évolutions sont fournies en fichiers séparés à exécuter dans Supabase SQL Editor :

- `evolution-v1.1.sql` : Seuils alertes configurables, dates annulées, vue alertes robuste
- `evolution-v1.2.sql` : Statut STAR, lien profil ↔ membre, fondations multi-église
- `evolution-v1.3-multi-eglise.sql` : Multi-église complet (RLS, triggers, indexes)
- `evolution-v1.4-activites-famille.sql` : Activités par famille, date_naissance, journal pastoral
- `evolution-v1.5-berger-eglise.sql` : Berger d'église (RLS lecture cross-famille)
- `evolution-v1.6-frequence-activites.sql` : Fréquence des activités (jour_semaine), détection dates manquantes
- `evolution-v1.7-desactivation.sql` : Flag actif sur eglises et familles_disciples (soft-delete)

---

## Développement

Pas de Node.js local requis — édition via GitHub web editor, Netlify redéploie automatiquement.

### Build
```
npm run build       → dossier dist/
```

### Structure des styles
- Palette : `#0ea888` (vert primaire), `#3060d0` (bleu info), `#d48f00` (orange warning), `#e03050` (rouge danger), `#7040d0` (violet)
- Grays : `#1a1e2e` texte, `#5a6480` sub-texte, `#6b7280` meta (WCAG AA), `#e0e4ec` bordures
- Polices : DM Sans / Outfit / Roboto Mono via Google Fonts CDN

### Responsive
- Mobile-first : `mob-only` / `desk-only` classes
- Breakpoint : 768px
- Viewport : `100dvh` + `viewport-fit=cover` (safe-area iOS)
- Nav bottom mobile avec 5 boutons + safe-area
- Sidebar fixe 210px desktop

### Principes
- **Zéro string hardcodée** : tout passe par `refHelpers(refs)`
- **Realtime** : 5 channels Supabase (membres, presences, entretiens, defis, plan_croissance)
- **Wrapper w()** : centralise try/catch + toast + reload pour toutes les opérations async
- **Body scroll lock** modales via `body:has(.modal-overlay){overflow:hidden}`

---

## Feuille de route

### v2 — Valeur pastorale forte
- Notifications email hebdomadaires (Supabase Edge Functions + Resend)
- Rapports mensuels PDF
- Dashboard personnalisé Pilier
- Log de communication (appels, SMS)

### v3 — Fonctionnalités avancées
- Mode hors-ligne (Service Worker + IndexedDB)
- Cellules de maison / groupes
- Événements (retraites, baptêmes)
- Recherche globale
- Journal d'audit
- API ouverte
