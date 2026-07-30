# Gestion des Âmes — Suivi Pastoral

Application web de gestion pastorale pour le suivi individualisé des membres d'une église, avec isolation multi-tenant complète (multi-églises, multi-familles).

**Production** : https://suivi-enracinees.netlify.app

---

## Stack technique

- **Frontend** : React 18 + Vite 5
- **Backend** : Supabase (PostgreSQL + Auth + Realtime + Row-Level Security + Edge Functions)
- **Hébergement** : Netlify (auto-deploy depuis GitHub)
- **Polices** : DM Sans (corps), Outfit (titres), Roboto Mono (monospace)
- **Icônes** : Lucide React
- **PWA** : Installable (manifest.json + icon-192.svg)

---

## Architecture

```
src/
├── main.jsx                    Point d'entrée + ErrorBoundary global
├── App.jsx                     Orchestrateur, hooks data, routing
├── lib/
│   ├── supabase.js            Client Supabase
│   ├── auth.jsx               Contexte auth (login/profil/rôles + needsPassword)
│   ├── data.js                14 hooks : useMembres, usePresences, useEntretiens, useDefis, usePlanCroissance, useAlertes, useRefs, useDatesAnnulees, useJournal, useHistoriqueStatuts, useProfils, useRefAdmin, refHelpers, resetAllData
│   └── ui.jsx                 Styles S, formatters, Toast, Skeleton
├── components/
│   ├── Layout.jsx             Sidebar + nav mobile + header + recherche globale
│   └── ErrorBoundary.jsx      Écran de récupération global
└── pages/
    ├── Login.jsx              Connexion (3 modes : login / forgot / sent)
    ├── SetPassword.jsx        Définition mot de passe (nouveaux invités)
    ├── AccessDenied.jsx       Accès en attente avec instructions
    ├── NoFamille.jsx          Utilisateur sans famille assignée
    ├── MenuMobile.jsx         Menu "Plus" mobile
    ├── Home.jsx               Tableau de bord (4 KPIs, checklist onboarding, Mes suivis)
    ├── Presences.jsx          Saisie des présences par activité/date
    ├── Ames.jsx               Membres — liste + création + import CSV + bulk actions + tri
    ├── Fiche.jsx              Fiche membre (6 onglets pastoraux)
    ├── Alertes.jsx            Alertes de suivi
    ├── EntretiensGlobal.jsx   Vue globale des entretiens + filtres
    ├── Croissance.jsx         Parcours de formation
    ├── Historique.jsx         Historique des présences par activité
    ├── Filiation.jsx          Organisation (qui suit qui)
    ├── Export.jsx             Export CSV + backup JSON + reset admin
    ├── Rapport.jsx            Rapport mensuel imprimable (PDF via navigateur)
    ├── CGU.jsx                Conditions d'utilisation (template RGPD)
    ├── Params.jsx             Paramètres (Références, Utilisateurs, Église)
    └── VueEglise.jsx          Synthèse église (Berger d'église)
```

---

## Vocabulaire produit

| Terme | Signification |
|---|---|
| **Membre** | Personne suivie par l'église |
| **Chef de famille** | Rôle principal d'un groupe (ex-"Berger principal") |
| **Pilier** | Rôle de leader intermédiaire (peut suivre d'autres) |
| **Famille** | Groupe de disciples au sein d'une église |
| **Église** | Entité organisationnelle regroupant plusieurs familles |
| **Berger d'église** | Vision macro sur toutes les familles d'une église |

**Statuts membres** (paramétrables) : Nouveau → Intégré → En difficulté → Archivé
**Rôles** : Chef de famille / Pilier / Membre
**Statuts défis** : Ouvert → En cours → Résolu / Abandonné
**Statuts entretiens** : Planifié / Réalisé / Annulé / Reporté

---

## Fonctionnalités principales

### Gestion des membres
- CRUD complet, import CSV (auto-détection UTF-8/windows-1252, batching)
- Actions en masse (statut, suiveur) — conditionnelles selon sélection
- Archivage réversible avec Restaurer
- Historique des statuts et du suivi pastoral
- Transfert intelligent entre familles
- Filtres : rôle, statut, "Mes suivis" (profil ↔ membre)
- Colonnes triables desktop (Nom / Rôle / Statut / Taux)
- Cartes compactes mobile, tableau desktop
- Recherche globale dans le header (nom, prénom, téléphone, email)

### Saisie des présences
- Par activité (Culte, Enseignement, Prière...) — par famille
- Boutons "Tous" / "Aucun"
- Dates annulées (les absences ne comptent pas)
- Détection présences orphelines (membre dont la date d'inscription a été changée)
- Barre "Enregistrer" sticky
- Message explicite si 0 activité configurée

### Fiche membre
- 6 onglets pastoraux : Identité, Journal, Entretiens, Présences, Défis, Formation
- Titre = nom du membre (pas de jargon "Fiche 360°")
- Menu Actions : Modifier / Archiver / Restaurer / Transférer (admin)
- Raccourci "Marquer présent aujourd'hui"
- Historique du suivi pastoral (5 derniers changements)
- Détection présences orphelines
- Bouton retour contextuel (← Alertes / ← Liste / ← Entretiens / ← Accueil)
- KPIs : jours depuis inscription, absences consécutives, entretiens, formation validée
- Modules de formation avec description + lien externe cliquable

### Alertes de suivi
- Score = absences (3pts) + jours sans entretien (2pts) + défis ouverts (1pt)
- Détail par pill coloré
- Seuils configurables via `ref_parametres`
- Filtrage intelligent : membres avec entretien planifié dans 30 jours = masqués

### Multi-église / Multi-tenant
- Tables `eglises` + `familles_disciples`
- `famille_id` sur toutes les tables de données
- RLS filtrant par famille (policies uniques, sans fallback NULL)
- Trigger `BEFORE INSERT` auto-injecte `famille_id` sur 9 tables — zéro orphelin possible
- Protection : un utilisateur ne peut pas changer sa propre `famille_id`
- Création de famille → 3 activités de base auto-créées
- Sélecteur de famille dans Paramètres → Activités (admin multi-familles)
- Super-admin bypass total

### Gestion des utilisateurs
- Invitation par email via Edge Function Supabase (`invite-user` v3)
- Formulaire : email, nom affiché, famille, rôle (Responsable/Admin/Berger d'église)
- Auto-fill du nom en liant à un membre
- L'invité reçoit un email → clique → définit son mot de passe → accès
- Page "Définir mon mot de passe" pour les nouveaux arrivants
- Mot de passe oublié (3 modes)
- Protection : impossible de retirer le dernier admin

### Berger d'église (synthèse macro)
- Page "Synthèse église" en lecture seule
- 4 KPIs : total actifs, taux culte moyen, nouveaux 30j, familles à risque
- Sections critiques : familles < 80% + familles en baisse -10 pts
- Comparatif par famille

### Modules de formation (parcours)
- 12 modules pré-remplis : vidéos ICC, livres Yvan Castanou, audio "Prions Ensemble"
- Description courte + lien externe cliquable (YouTube, Spotify, Amazon)
- Bouton "Accéder au contenu →" dans la fiche membre

### Autres
- Journal pastoral (notes, appels, visites, SMS)
- Anniversaires (notification dashboard)
- Détection tendance présence en baisse
- Filtres dates (Entretiens, Historique)
- Détection dates manquantes activités récurrentes
- Rapport mensuel imprimable (PDF via navigateur, print CSS)
- Backup JSON manuel (compensation plan gratuit sans backup Supabase)
- PWA installable

---

## Rôles & permissions

| Rôle | Peut... |
|---|---|
| **Membre** (par défaut) | Aucun accès à l'app |
| **Responsable** (`est_responsable`) | Lire et modifier les données de sa famille |
| **Admin** (`est_admin`) | + Références, gestion utilisateurs, reset données |
| **Berger d'église** (`est_berger_eglise`) | + Lire toutes les familles de son église |
| **Super-admin** (`est_super_admin`) | + Bypass RLS, accès total |

---

## Base de données

### Tables principales
- `membres`, `presences`, `entretiens`, `defis`, `plan_croissance`
- `historique_statuts`, `historique_suivi`, `journal_pastoral`, `dates_annulees`

### Tables de référence
- `ref_roles`, `ref_statuts`, `ref_statuts_defi`, `ref_statuts_entretien`
- `ref_sujets_entretien`, `ref_types_defi`, `ref_parametres`
- `activites` (par famille), `modules` (avec description + url)

### Multi-tenant
- `eglises`, `familles_disciples` (avec flag `actif` soft-delete)
- `profils` (lié à `auth.users` : famille_id, eglise_id, membre_id, flags rôles, nom_affiche)

---

## Migrations SQL

À exécuter dans Supabase SQL Editor, **dans l'ordre** :

1. `evolution-v1.1.sql` — Seuils alertes, dates annulées, vue alertes
2. `evolution-v1.2.sql` — Fondations multi-église, lien profil↔membre
3. `evolution-v1.3-multi-eglise.sql` — Multi-église complet (RLS, triggers)
4. `evolution-v1.4-activites-famille.sql` — Activités par famille, date_naissance, journal
5. `evolution-v1.5-berger-eglise.sql` — Berger d'église (RLS cross-famille)
6. `evolution-v1.6-frequence-activites.sql` — jour_semaine, détection dates manquantes
7. `evolution-v1.7-desactivation.sql` — Flag actif (soft-delete)
8. `evolution-v1.8-eligibilite-coherence.sql` — Trigger recalcul éligibilité
9. `evolution-v1.9-audit-experts.sql` — Historique suivi, anti-auto-suivi
10. `evolution-v2.0-multi-tenant-fix.sql` — **Triggers auto famille_id (9 tables)**
11. `fix-rls-isolation.sql` — **Suppression policies RLS doublons**
12. `migration-isolation-familles.sql` — Rattachement données orphelines
13. `evolution-v2.1-modules-enrichis.sql` — Colonnes description + url sur modules + statuts défis/entretiens
14. `evolution-v2.2-statuts-roles-modules.sql` — Suppression STAR, rename Berger principal → Chef de famille, 12 modules ICC pré-remplis

### Edge Functions
- `invite-user` (v3) — Inviter un utilisateur avec attribution des rôles (attend le trigger DB puis UPDATE)

---

## Configuration environnement

`.env` (à créer depuis `.env.example`) :
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

---

## Développement

Pas de Node.js local requis — édition via GitHub web editor, Netlify redéploie automatiquement.

### Build
```
npm run build       → dossier dist/
```

### Palette
- **Primaire** : `#0ea888` (vert), `#3060d0` (bleu info), `#d48f00` (orange), `#e03050` (rouge), `#7040d0` (violet)
- **Grays** : `#1a1e2e` (texte), `#5a6480` (sub-texte), `#6b7280` (meta), `#e0e4ec` (bordures), `#f4f6f9` (bg)

### Responsive / UX
- Mobile-first, breakpoint 768px
- Sidebar 210px desktop, nav bottom 5 items mobile
- `box-sizing: border-box` global
- `font-family: inherit` sur form controls
- `accent-color: #0ea888` checkboxes/radios
- Focus visible clavier
- Tailles typo : 14px body / 13px courant / 12px meta / 10-11px micro
- Skeleton loading animé
- Transitions boutons (scale 0.97), modales (fade-in), toast (slide-up)
- Empty states engageants avec CTA

### Principes techniques
- Zéro string hardcodée : tout via `refHelpers(refs)`
- Realtime : 5 channels Supabase (membres, presences, entretiens, defis, plan_croissance)
- Wrapper `w()` centralise try/catch + toast + reload
- ErrorBoundary global + reload button
- Recherche globale header (filtre client-side, 200 max)
- Body scroll lock modales
- Trigger SQL recalcule éligibilité présences si date_inscription change
- Import CSV : batching 50 lignes, UTF-8/Windows-1252/BOM

---

## Version

`v1.0.0` — Visible en bas de sidebar et menu mobile.

---

## Feuille de route

### v1.x — Quick wins production ✅ (livrés)
- ErrorBoundary global
- Backup JSON manuel
- Skeleton loading
- Recherche globale
- Rapport mensuel imprimable
- CGU / RGPD template
- Colonnes triables
- Onboarding checklist

### v2 — Monétisation (à venir)
- Mode hors-ligne (Service Worker + IndexedDB) — **bloquant monétisation**
- Notifications email hebdomadaires (Edge Functions + Resend) — **bloquant monétisation**
- CGU juridiquement validée
- Rapport PDF exportable (au lieu de print)
- Onboarding guidé complet (wizard 4 étapes)
- Documentation utilisateur intégrée

### v3 — Fonctionnalités avancées
- Cellules de maison / groupes
- Événements (retraites, baptêmes)
- Journal d'audit (qui a modifié quoi)
- Log de communication (appels, SMS)
- API ouverte
- Tests automatisés (vitest configuré, tests à écrire)
