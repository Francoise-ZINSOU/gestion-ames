# Gestion des Âmes — Suivi Pastoral

### Rafraîchissement des rôles sans reconnexion (session e42)
À chaque navigation, le profil (et donc les rôles) est rechargé depuis la base, au plus une fois toutes les 30 s (throttle via useRef dans App.jsx, réutilise auth.reloadProfil). Un changement de rôle (ex. passer quelqu'un berger, ou le rétrograder) prend désormais effet en quelques clics, sans que l'utilisateur ait à se déconnecter/reconnecter. Répond au cas observé : « il avait encore les anciens accès ».


### Test des rôles et transitions (session e41)
Nouveau fichier de test permanent src/__tests__/roles.test.jsx : vérifie les états de rôle ET les transitions (le "film" : responsable → berger, admin → responsable, etc.), avec en tête le cas Alfred (berger gardant une famille héritée = berger pur). 13 assertions. Tourne dans la CI à chaque build → si une modif future casse la logique des rôles, le build échoue. Motivé par le fait que le cas Alfred n'avait pas été détecté (test des états figés seulement, pas des transitions).


### Berger pur fondé sur les rôles + alerte suivis (session e40)
Trois corrections liées : (A) un berger qui garde une famille héritée d'un ancien rôle responsable est désormais reconnu comme berger pur — la logique se fonde sur les rôles cochés (est_berger_eglise && !responsable && !admin && !super_admin), plus sur famille_id. (B) Définition unique isBergerPur dans auth.jsx, réutilisée dans App/Layout/MenuMobile (fini les 4 formules divergentes). (C) Avertissement au changement de rôle (retrait de responsable, ou activation berger) si la personne accompagne des membres, pour penser à réassigner les suivis. Rappel : le profil n'est rechargé qu'au login — un changement de rôle prend effet à la reconnexion (ou via reloadProfil).


### Cohérence des rôles (audit systématique — session e39)
Test de tous les rôles → 3 anomalies corrigées : (1) le super-admin peut désormais accéder aux Paramètres (params : isAdmin OU isSuperAdmin) ; (2) le super-admin peut supprimer (peutSuppr : isAdmin OU isSuperAdmin, dans Fiche/Presences/Croissance) ; (3) un berger qui est AUSSI responsable garde toutes ses fonctions famille (Présences, Entretiens) — seul le berger PUR reste en lecture seule (conditions !isBergerEglise remplacées par !bergerPur). Fichiers : App.jsx, Layout.jsx, MenuMobile.jsx, Fiche.jsx, Presences.jsx, Croissance.jsx.


### Garde-fous import CSV super-admin (session e38)
Deux correctifs sur l'import CSV : (1) le bouton CSV reçoit le même garde-fou « super-admin sans périmètre » que le bouton + Membre (évite de créer des membres orphelins sans famille) ; (2) quand un super-admin a choisi un périmètre, le famille_id (scopeFamilleId) est désormais posé sur les lignes importées, comme pour la création unitaire.


### Support du berger pur (session e37)
Un berger d'église sans famille propre était bloqué par AccessDenied (isResponsable requis) puis par NoFamille. Corrigé : il peut entrer, atterrit sur sa Synthèse église, son menu (desktop + mobile) est réduit à Synthèse + Alertes, et un garde-fou de routage redirige toute page « famille » vers sa Synthèse. Concerne App.jsx, Layout.jsx, MenuMobile.jsx.


### Synthèse église réservée au berger et super-admin (session e36)
La Synthèse église (vision transversale) était accessible à tout admin, qui voyait une page à moitié vide (la RLS masquait les autres familles — pas de fuite, mais incohérent). Elle est désormais réservée au berger d'église et au super-admin, aux trois niveaux : accès page (App.jsx), menu desktop (Layout.jsx), menu mobile (MenuMobile.jsx).


### Sélecteurs de famille réservés au super-admin (session e35)
Deux sélecteurs d'interface montraient l'église/famille à un admin ordinaire : la réassignation de famille dans l'onglet Utilisateurs, et le choix de famille pour les activités dans l'onglet Références. Tous deux sont désormais limités — un admin ne voit que sa propre famille (activités) ou plus rien (réassignation). Cohérence d'interface : la RLS bloquait déjà tout changement effectif.


### Invitation limitée à la famille de l'admin (session e34)
Après clarification : un admin gère SA FAMILLE (pas son église). L'invitation est donc restreinte à sa seule famille, aux deux niveaux — interface (menu à une option) et Edge Function invite-user v5 (validation serveur famille_id === profil.famille_id). Le super-admin invite toujours partout.


### Onglet Église réservé au super-admin (session e33)
L'onglet « Église » des paramètres (création/désactivation d'églises et de familles) est désormais masqué aux admins non super-admins — cohérent avec la base, qui réservait déjà l'écriture au super-admin (policies v2.5/v2.6).


### Cloisonnement de l'invitation admin (session e32)
Le menu de sélection de famille à l'invitation ne propose plus que les familles de l'église de l'admin (le super-admin voit toujours toutes les églises). Correctif d'interface. ⚠ La vraie barrière doit aussi être dans l'Edge Function invite-user (validation serveur que l'admin a le droit sur la famille ciblée) — à renforcer séparément.


### Date par défaut de la saisie de présences (session e31)
À l'ouverture de la saisie (et au changement d'activité), la date se cale automatiquement sur la dernière occurrence du jour de l'activité (culte du dimanche → dernier dimanche) au lieu de la date du jour. Évite de proposer un culte du dimanche un vendredi. Les activités ponctuelles (sans jour_semaine) gardent la date du jour.


### Nettoyage du raccourci « Fiche » du menu (session e30)
L'entrée « Fiche » du menu (desktop et mobile) ne s'affiche plus que tant qu'un membre est réellement ouvert. Quitter la fiche vers une autre page efface la sélection (setSelectedId(null) via une fonction navigateTo), au lieu de laisser le raccourci affiché jusqu'au rechargement.


### Détection de doublons améliorée (session e29)
La détection de doublons à la création d'un membre (formulaire et import CSV) est désormais prudente et tolérante : normalisation (accents, apostrophes droites/typographiques, tirets, espaces, casse), prénom identique OU inclus dans l'autre (Marina ⊆ Marina-Ingrid), nom identique OU à une faute de frappe près. Restreinte à la même famille. Message d'avertissement nommant la ou les personnes déjà présentes (avertissement, pas blocage).


### Confirmation renforcée super-admin hors famille (session e28)
Quand un super-administrateur archive un membre d'une famille autre que la sienne, une confirmation explicite l'avertit qu'il agit sur une communauté qui n'est pas la sienne. Garde-fou d'interface contre les fausses manipulations (la base autorise toujours l'action, conforme au rôle super-admin).


### Garde-fous à la désactivation des références (session e27)
- L'activité « culte » ne peut plus être désactivée (protège la saisie des présences).
- Un statut/rôle désactivé reste affiché « (obsolète) » sur la fiche d'un membre qui l'utilise, pour ne pas forcer un changement.
- Avertissement « utilisée par N enregistrement(s) » avant de désactiver une valeur déjà employée.


### Rapport pastoral refondu (session e24)
Le rapport passe de bilan de chiffres à outil de pilotage : encart « À faire ce mois-ci » (actions déduites), liste des personnes sans entretien depuis 60 j, comparaison vs période précédente (▲▼), avancement des parcours de formation, statut « à accompagner » nommé explicitement, et sélecteur de période (30 j glissants ou mois calendaire).


### Défauts de conception corrigés (session e22)
- Le chef de famille n'est pas compté dans le taux de présence ni affiché dans la saisie des présences (c'est un accompagnateur, pas un membre suivi).
- Rôle « Admin » implique désormais « Responsable » (cohérence de la porte d'entrée), à l'invitation et dans la liste.
- Invitation : blocage si l'email a déjà un compte + validation du format.
- Perte de connexion aux données : bandeau d'alerte avec bouton « Réessayer » (au lieu de listes vides silencieuses).


### Fil d'activité récente
L'accueil affiche un encart « Activité récente » fusionnant nouveaux membres, changements de statut (table `historique_statuts`), entretiens et défis, triés par date. Hook `useHistoriqueStatutsGlobal` dans data.js. Filtré par périmètre pour le super-admin.


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
- CRUD complet, champs : identité, contact, date de naissance, nationalité (texte libre), situation professionnelle (liste modifiable)
- Import CSV (auto-détection UTF-8/windows-1252)
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
- 6 parcours de formation (playlists vidéo) : Vaincre l'offense · En finir avec le péché sexuel · Sortir de la procrastination · Triompher de la peur · Triompher dans le combat spirituel · Demeurer dans l'action de grâce

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
- `sujets_entretien` (⚠️ sans préfixe `ref_`), `ref_types_defi`, `ref_motifs_depart`, `ref_situations_pro`
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
- `evolution-v2.2-statuts-roles-modules.sql` : Suppression STAR (migration vers Intégré), renommage Berger principal → Chef de famille, 6 parcours de formation (playlists vidéo)
  ⚠️ **v2.1 doit impérativement précéder v2.2** (v2.2 insère dans les colonnes créées par v2.1)
- `evolution-v2.4-integrite-schema.sql` : FK `ON UPDATE CASCADE` sur les référentiels (renommage sûr), unicité présences/dates annulées, contraintes anti-auto-suivi, `famille_id NOT NULL` sur les 9 tables de données, indexes sur les FK
- `evolution-v2.7-nationalite-situation-pro.sql` : Champs `nationalite` + `situation_professionnelle` sur membres, table de référence `ref_situations_pro`
- `fix-alertes-seuil-30j-v3.6.sql` : Aligne le seuil « sans entretien » à 30 jours entre la vue v_alertes (base) et le code. Met ref_parametres.seuil_jours_sans_entretien=30 et passe l'opérateur du critère entretien de > à >= (cohérent avec le critère absences).
- `fix-integrite-hierarchie-suivi-v3.5.sql` : Trigger empêchant qu'un membre soit son propre suiveur ou qu'une boucle hiérarchique se forme (protège l'arbre d'organisation).
- `fix-protege-dernier-superadmin-v3.4.sql` : Trigger empêchant de retirer le rôle au dernier super-admin (évite le blocage total : plus personne ne pourrait en recréer). Côté UI, on bloque aussi « se retirer soi-même ».
- `fix-rls-journal-berger-v3.3.sql` : Retire au berger d'église la LECTURE du journal pastoral (confidentialité / RGPD). Il garde les indicateurs (statut, absences) mais plus le contenu des notes.
- `fix-rls-delete-admin-v3.2.sql` : Réserve la SUPPRESSION (ligne isolée et réinitialisation) aux admins sur 8 tables sensibles — les politiques `ALL` deviennent SELECT/INSERT/UPDATE (responsable) + DELETE (admin). Boutons de suppression de l'UI masqués pour les non-admins.
- `evolution-v3.1-refs-nettoyage.sql` : Correction des ordres en doublon (statuts d'entretien, statuts membres) et affinage des types de défis (« Spirituel » → « Spirituel / foi », ajout « Autre »)
- `evolution-v3.0-modules-formation.sql` : Remplacement complet du référentiel des parcours de formation par 6 playlists vidéo (purge des modules et assignations existants)
- `evolution-v2.9-vocabulaire-palette.sql` : Renommage statut « En difficulté » → « À accompagner » (CASCADE), alignement des couleurs de référence sur la palette terracotta
- `evolution-v2.8-coherence-metier.sql` : Contraintes de cohérence — ordre des dates (naissance ≤ inscription ≤ départ ≤ retour), résolution défi ≥ identification, validation module ≥ assignation, âge plausible, triggers suiveur/interlocuteur intra-famille, nettoyage du suivi au transfert de famille
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

### Structure des styles — palette « bleu-canard et sable » (pastorale)
- Palette centralisée dans `src/lib/ui.jsx` (objet `C`) — point de vérité unique
- Identité : `#2E7D8A` (bleu-canard / sarcelle — nav, liens, actions, focus, accent-color)
- Accent chaud : `#C68A3E` (ambre — moments positifs, anniversaires, attention bienveillante)
- Sémantique : `#4E8D6E` (vert d'eau — présent/positif), `#C25A4A` (danger réel, rare), `#8B5B9E` (violet — formation)
- Neutres : `#2B3A3D` texte, `#5E7175` sous-texte, `#8A9B9E` méta, `#DCE6E5` bordures, `#F5F3EE` fond crème
- Cartes : ombre douce, coins 14px, air généreux
- Accueil épuré et adaptatif : église vide → checklist seule ; église active → salutation + KPIs + bloc « Aujourd'hui » fusionné
- Vocabulaire humanisé : « À accompagner », « Membres actifs », « Présence au culte » ; libellés en minuscules
- Polices : DM Sans / Outfit / Roboto Mono via Google Fonts CDN
- `theme-color` (index.html + manifest.json) : `#2E7D8A`

### Responsive / UX mobile
- Mobile-first : `mob-only` / `desk-only` classes
- Breakpoint : 768px
- Viewport : `100dvh` + `viewport-fit=cover` (safe-area iOS)
- Nav bottom mobile avec 5 boutons + safe-area
- Sidebar fixe 210px desktop
- `box-sizing: border-box` global (aucun overflow)
- `font-family: inherit` sur tous les form controls
- `accent-color: #2E7D8A` sur checkboxes/radios
- Focus visible clavier : `outline: 2px solid #2E7D8A`
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
