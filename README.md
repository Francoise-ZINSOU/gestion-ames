# Gestion des Âmes — Suivi Pastoral

Application web de gestion pastorale pour le suivi individualisé des membres d'une église.

**Production** : https://suivi-enracinees.netlify.app

---

## Stack technique

- **Frontend** : React 18 + Vite
- **Backend** : Supabase (PostgreSQL + Auth + Realtime + Row-Level Security)
- **Hébergement** : Netlify (auto-deploy depuis GitHub)
- **Tests** : Vitest + Testing Library (jsdom), exécutés via GitHub Actions
- **Polices** : DM Sans (corps), Outfit (titres), Roboto Mono (code)
- **Icônes** : Lucide React

---

## Vocabulaire de l'interface

Les libellés ont été finalisés en v2.2. Les noms de fichiers conservent l'ancien vocabulaire (renommer les fichiers casserait l'historique Git pour un gain nul) :

| Libellé affiché | Fichier / concept technique |
|---|---|
| Membres | `Ames.jsx`, table `membres` |
| Présences | `Presences.jsx` |
| Organisation | `Filiation.jsx` (arbre de suivi) |
| Parcours de formation | `Croissance.jsx`, table `plan_croissance` |
| Synthèse église | `VueEglise.jsx` |
| Chef de famille | ex-"Berger principal" (`ref_roles`) |

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
    ├── Login.jsx              Connexion (3 modes : login / forgot / sent)
    ├── SetPassword.jsx        Définition mot de passe (nouveaux utilisateurs invités)
    ├── AccessDenied.jsx       Accès en attente (instructions claires pour obtenir l'accès)
    ├── NoFamille.jsx          Utilisateur sans famille assignée
    ├── MenuMobile.jsx         Menu "Plus" mobile
    ├── Home.jsx               Dashboard (4 KPIs figés, bandeau Pilier, notifications badges)
    ├── Presences.jsx          Saisie des présences par activité/date
    ├── Ames.jsx               Membres : liste + création + import CSV + actions en masse
    ├── Fiche.jsx              Fiche 360° (6 onglets : Identité, Journal, Entretiens, Présences, Défis, Formation)
    ├── Alertes.jsx            Alertes de suivi avec détail du score
    ├── EntretiensGlobal.jsx   Vue globale des entretiens
    ├── Croissance.jsx         Parcours de formation
    ├── Historique.jsx         Graphique + tableau présences par activité
    ├── Filiation.jsx          Organisation : arbre de suivi récursif
    ├── Export.jsx             Export CSV + backup JSON + reset données
    ├── Rapport.jsx            Rapport mensuel imprimable (Imprimer → PDF natif)
    ├── CGU.jsx                Conditions d'utilisation (template RGPD — contenu juridique à finaliser)
    ├── Params.jsx             Paramètres (Références, Utilisateurs, Église)
    └── VueEglise.jsx          Synthèse église : vue macro multi-familles (Berger d'église)
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
- 6 onglets (ordre pastoral) : Identité, Journal, Entretiens, Présences, Défis, Formation
- Menu "⋯ Actions" : Modifier / Archiver / Restaurer / Transférer (admin)
- Raccourci "Marquer présent aujourd'hui" (en haut de l'onglet Identité)
- Historique du suivi pastoral (5 derniers changements de suiveur)
- Détection présences orphelines (membre dont la date d'inscription a changé)
- Bouton retour contextuel (← Alertes / ← Liste / ← Entretiens / ← Accueil)
- KPIs : jours depuis inscription, absences consécutives, entretiens, parcours validé
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
- Filtre "Avec qui" = uniquement Chefs de famille + Piliers (peut_suivre)
- Détection des entretiens planifiés en retard
- Statuts complets : Planifié / Réalisé / Reporté / Annulé (traçabilité)
- Pagination "Voir plus" (30 par batch)

### Parcours de formation
- Modules liés à des défis via `defi_id`
- Suivi individuel + collectif
- Chaque module a une **description** + un **lien externe** (`url`) : bouton "Accéder au contenu →" dans la fiche membre
- 12 modules pré-remplis (enseignements, livres et audio du Pasteur Yvan Castanou / ICC — Impact Centre Chrétien)

### Organisation
- Arbre de suivi récursif (Chef de famille → Pilier → Pilier → Membre)
- Piliers non rattachés = signal d'anomalie
- Membres sans suiveur affichés séparément

### Multi-église / Multi-tenant
- Table `eglises` + `familles_disciples`
- `famille_id` sur toutes les données
- RLS filtrant par famille (policies uniques, sans fallback NULL)
- Trigger `BEFORE INSERT` auto-injecte `famille_id` sur 9 tables — zéro orphelin possible
- Protection : un utilisateur ne peut pas changer sa propre `famille_id`
- Création de famille → 3 activités de base auto-créées (Culte, Enseignement, Prière)
- Sélecteur de famille dans Paramètres → Activités (admin multi-familles)
- Super-admin bypass total

### Gestion des utilisateurs
- Invitation par email via Edge Function Supabase (`invite-user`, **v3** : polling pour contourner la race condition entre le trigger DB et l'écriture du flag `est_responsable`)
- Formulaire : email, nom affiché, famille, rôle (Responsable/Admin)
- L'invité reçoit un email → clique → définit son mot de passe → accès
- Page "Définir mon mot de passe" pour les nouveaux arrivants
- Mot de passe oublié (3 modes : connexion / réinitialisation / confirmation)
- Protection : impossible de retirer le dernier admin

### Berger d'église (Synthèse église)
- Page "Synthèse église"
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

### Filtres de dates
- Page Entretiens : filtre par période (date début → date fin)
- Page Historique : filtre par période avec bouton effacer
- Synthèse église : filtre automatique des dates annulées

### Détection des dates manquantes
- Activités récurrentes : chaque activité peut avoir un jour de la semaine (`jour_semaine`)
- Historique : 3 états visuels distincts (saisie / annulée / non saisie)
- Dashboard : notification "X culte(s) non saisi(s) sur les 30 derniers jours"

### PWA
- Installable sur écran d'accueil (mobile + desktop)
- Icône dédiée, plein écran, theme-color aligné sur la couleur primaire (`#185FA5`)
- ⚠️ iOS exige un PNG pour `apple-touch-icon` : fournir `/public/icon-180.png` (les SVG sont ignorés)

---

## Rôles & permissions

| Rôle | Peut... |
|---|---|
| **Membre** (par défaut) | Aucun accès à l'app |
| **Responsable** (`est_responsable`) | Lire et modifier les données de sa famille |
| **Admin** (`est_admin`) | + Modifier les tables de référence, gérer les utilisateurs |
| **Berger d'église** (`est_berger_eglise`) | + Lire toutes les familles de son église (page "Synthèse église") |
| **Super-admin** (`est_super_admin`) | + Bypass RLS, accès total |

Un utilisateur peut cumuler plusieurs rôles.

---

## Base de données

### Tables principales
- `membres` : les âmes suivies
- `presences` : présences par membre/activité/date
- `entretiens` : entretiens pastoraux
- `defis` : défis à surmonter
- `plan_croissance` : modules assignés/validés (parcours de formation)
- `historique_statuts` : trace des changements de statut
- `historique_suivi` : trace des changements de suiveur (v1.9)
- `journal_pastoral` : notes libres
- `dates_annulees` : dates où les absences ne comptent pas

### Tables de référence
- `ref_roles` : Chef de famille / Pilier / Membre
- `ref_statuts` : Nouveau / Intégré / En difficulté / Archivé *(STAR supprimé en v2.2, membres migrés vers Intégré)*
- `ref_statuts_defi` : ... + Abandonné (état final)
- `ref_statuts_entretien` : ... + Reporté, Annulé
- `sujets_entretien` (⚠️ sans préfixe `ref_`), `ref_types_defi`, `ref_motifs_depart`
- `activites` : Culte, Enseignement, Prière, etc. (par famille)
- `modules` : modules du parcours de formation (avec `description` + `url`)
- `ref_parametres` : seuils configurables

⚠️ **Périmètre des référentiels** : `modules`, `ref_parametres` et toutes les tables `ref_*` / `sujets_entretien` sont **globales** (pas de `famille_id`) — partagées entre toutes les églises. Neutre en mono-église, à cloisonner avant la monétisation multi-église (voir section 6 de `evolution-v2.4-integrite-schema.sql`).

Les FK `membres.statut`, `membres.role`, `defis.statut`, `defis.type_defi`, `entretiens.statut`, `membres.motif_depart` référencent la colonne `nom` (texte) avec `ON UPDATE CASCADE` (v2.4) : renommer un libellé dans Paramètres → Références propage automatiquement.

### Multi-tenant
- `eglises` : églises
- `familles_disciples` : familles au sein d'une église
- `famille_id` sur toutes les tables de données
- `profils` : lié à `auth.users`, contient `famille_id`, `eglise_id`, `membre_id`, flags de rôles

---

## Migrations SQL

Les évolutions sont fournies en fichiers séparés à exécuter dans Supabase SQL Editor, **dans l'ordre des versions** (des dépendances de colonnes existent entre fichiers) :

- `evolution-v1.1.sql` : Seuils alertes configurables, dates annulées, vue alertes robuste
- `evolution-v1.2.sql` : Statut STAR, lien profil ↔ membre, fondations multi-église
- `evolution-v1.3-multi-eglise.sql` : Multi-église complet (RLS, triggers, indexes)
- `evolution-v1.4-activites-famille.sql` : Activités par famille, date_naissance, journal pastoral
- `evolution-v1.5-berger-eglise.sql` : Berger d'église (RLS lecture cross-famille)
- `evolution-v1.6-frequence-activites.sql` : Fréquence des activités (jour_semaine), détection dates manquantes
- `evolution-v1.7-desactivation.sql` : Flag actif sur eglises et familles_disciples (soft-delete)
- `evolution-v1.8-eligibilite-coherence.sql` : Trigger recalcul éligibilité présences + code activités nullable + fix ponctuel
- `evolution-v1.9-audit-experts.sql` : Historique du suivi pastoral, contrainte anti-auto-suivi
- `evolution-v2.0-multi-tenant-fix.sql` : Triggers auto `famille_id` sur 9 tables, protection auto-transfert
- `evolution-v2.1-modules-enrichis.sql` : Colonnes `description` + `url` sur modules, statuts Abandonné (défis) / Reporté, Annulé (entretiens)
- `evolution-v2.2-statuts-roles-modules.sql` : Suppression STAR (migration vers Intégré), renommage Berger principal → Chef de famille, 12 modules de formation pré-remplis (ICC / Yvan Castanou)
  ⚠️ **v2.1 doit impérativement précéder v2.2** (v2.2 insère dans les colonnes créées par v2.1)
- `evolution-v2.4-integrite-schema.sql` : FK `ON UPDATE CASCADE` sur les référentiels (renommage sûr), unicité présences/dates annulées, contraintes anti-auto-suivi, `famille_id NOT NULL` sur les 9 tables de données, indexes sur les FK
- `audit-coherence-v2.3.sql` : Script d'audit idempotent — vérifie que v2.1/v2.2 sont bien appliquées, l'absence d'orphelins `famille_id`, de policies RLS avec fallback NULL et de policies en doublon

Correctifs critiques autonomes :
- `fix-rls-isolation.sql` : Suppression policies RLS doublons, retrait fallback `IS NULL`, isolation complète
- `fix-rls-doublons-v2.5.sql` : Purge des policies héritées (génération `is_*`) qui court-circuitaient l'isolation sur `activites`/`eglises`/`ref_statuts` + trigger anti-escalade de privilèges sur `profils`
- `fix-rls-berger-lecture-seule-v2.6.sql` : Berger d'église strictement lecture seule (retrait de la branche berger des policies d'écriture sur 8 tables), correction de la fuite « Admin familles ». Décision produit : le Berger d'église **lit** le journal pastoral (lecture seule) — à mentionner explicitement dans la page CGU/confidentialité (transparence RGPD)
- `migration-isolation-familles.sql` : Rattachement données orphelines, création activités par famille

---

## Développement

Pas de Node.js local requis — édition via GitHub web editor, Netlify redéploie automatiquement.

### Tests & CI
- Framework : **Vitest** (environnement `jsdom`, configuré dans `vite.config.js`) + Testing Library
- Sans environnement local, les tests s'exécutent dans **GitHub Actions** (`.github/workflows/ci.yml`) à chaque push, avant le déploiement Netlify
- Convention : fichiers `*.test.jsx` à côté du composant testé
- `passWithNoTests: true` tant que la suite de tests est en cours de constitution

### Build
```
npm run build       → dossier dist/
npm run test        → Vitest (CI uniquement, pas de Node local)
```

### Structure des styles
- Palette réelle du code : `#185FA5` (bleu primaire — nav, focus, accent-color), `#059669` (vert succès), `#E11D48` (rouge danger), `#7040d0` (violet formation)
- Grays (slate) : `#1E293B` texte, `#475569` sub-texte, `#64748B` meta, `#E2E8F0` bordures, `#EEF2F7` fond
- Polices : DM Sans / Outfit / Roboto Mono via Google Fonts CDN
- `theme-color` (index.html + manifest.json) : `#185FA5`

### Responsive / UX mobile
- Mobile-first : `mob-only` / `desk-only` classes
- Breakpoint : 768px
- Viewport : `100dvh` + `viewport-fit=cover` (safe-area iOS)
- Nav bottom mobile avec 5 boutons + safe-area
- Sidebar fixe 210px desktop
- `box-sizing: border-box` global (aucun overflow)
- `font-family: inherit` sur tous les form controls
- `accent-color: #185FA5` sur checkboxes/radios
- Focus visible clavier : `outline: 2px solid #185FA5`
- Tailles minimales : body 14px, texte courant 13px, meta 12px, micro 10-11px
- Cartes membres compactes (~60px), bulk bar conditionnelle
- Dropdown activités sur mobile (boutons sur desktop)
- Recherche cachée si < 15 membres
- Modales max-height 88dvh sur mobile, toast à bottom 80px

### Principes
- **Zéro string hardcodée** : tout passe par `refHelpers(refs)`
- **Realtime** : 5 channels Supabase (membres, presences, entretiens, defis, plan_croissance)
- **Wrapper w()** : centralise try/catch + toast + reload pour toutes les opérations async
- **Body scroll lock** modales via `body:has(.modal-overlay){overflow:hidden}`
- **Éligibilité cohérente** : trigger SQL recalcule `eligible` quand `date_inscription` change
- **Avertissement** visible quand on modifie une date d'inscription (recalcul des présences)
- **Import CSV** : batching 50 lignes, feedback progressif, gestion encodage UTF-8/Windows-1252/BOM

---

## Feuille de route

### v2 — Valeur pastorale forte
- Notifications email hebdomadaires (Supabase Edge Functions + Resend) — **blocker monétisation**
- Rapports mensuels PDF automatisés (le rapport imprimable natif existe déjà : `Rapport.jsx`)
- Contenu juridique de la page CGU (le template `CGU.jsx` existe, textes RGPD à finaliser) — **blocker monétisation**
- ~~Rapport mensuel imprimable (Imprimer → PDF natif)~~ ✓
- ~~Dashboard personnalisé Pilier~~ ✓ (bandeau "Mes suivis" sur l'accueil)

### Qualité production
- ErrorBoundary global (écran "Quelque chose s'est mal passé" au lieu d'écran blanc)
- Version visible (v1.0.0) dans le footer sidebar et menu mobile
- Sauvegarde JSON manuelle (Export → Télécharger le backup JSON)
- Skeleton loading animé pendant le chargement des données
- Transitions CSS sur boutons et modales
- Toast animé (slide-up)
- Empty states engageants ("Votre famille est prête 🌱")
- Colonnes triables dans la liste des membres (clic sur l'en-tête)
- Reset données : admin-only avec avertissement multi-tenant
- Log de communication (appels, SMS)
- Premiers tests Vitest (fmt/dago, refHelpers, calcul du score d'alerte)
- Icône `icon-180.png` (PNG) pour iOS

### v3 — Fonctionnalités avancées
- Mode hors-ligne (Service Worker + IndexedDB) — **blocker monétisation**
- Cellules de maison / groupes
- Événements (retraites, baptêmes)
- Recherche globale
- Journal d'audit
- API ouverte
