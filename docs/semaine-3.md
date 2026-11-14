# Semaine 3 — Bilan du harnais agentique

Projet Gesta (BINV3220y, groupe 08). Constats établis en novembre 2026 sur la branche `semaine-3`, créée à partir de `main` au commit `dc38690`.

Légende de la colonne « Statut » : **exécuté** = lancé pendant la séance avec une sortie observée ; **lu** = fichier ouvert et lu, mais rien d'exécuté ; **non vérifié** = non ouvert ou non lancé.

---

## 1. Inventaire des guides et des senseurs

### Matrice

| | Guide (feedforward) | Senseur (feedback) |
|---|---|---|
| **Inférentiel** | `AGENTS.md` ; `.github/pull_request_template.md` | aucun trouvé |
| **Computationnel** | `.npmrc` (`ignore-scripts=true`) | `oxlint`, `tsc`, `vitest`, builds (via `npm run check`) ; `requireSupportedNode.ts` |

Deux cases sont à relativiser : aucun générateur de code ni outil de scaffolding n'existe, et aucune revue de code par IA n'est configurée dans le dépôt (voir « Ce qui n'existe pas »).

### Détail des mécanismes

| Mécanisme | Emplacement | Rôle (demande, impose ou vérifie) | Exemple concret | Statut |
|---|---|---|---|---|
| Consignes de l'agent | `AGENTS.md` | Guide inférentiel. Décrit le démarrage, l'organisation en couches, les règles de base de données et le travail attendu. | « Les droits doivent être vérifiés côté backend » ; « Avant une modification importante, exécuter `npm run check` » | lu en entier. Aucun outil ne vérifie qu'il est respecté. |
| Template de PR | `.github/pull_request_template.md` | Guide inférentiel : checklist remplie par l'auteur de la PR. | « `npm run check` passe sans erreur ni avertissement » ; « Conversation exportée dans `docs/conversation-N.md` » | lu. Les cases sont cochées à la main, rien ne les contrôle. |
| Documents de référence | `docs/architecture.md`, `docs/seed.md`, `docs/cdc_gesta_developpement.md`, `backend/API.md` | Guides inférentiels cités par `AGENTS.md`. | EF-32 et EF-33 dans le cahier des charges (§7.4) | existence vérifiée (`ls`). `cdc` et `seed.md` lus en partie. `architecture.md` non audité. |
| Guide de démarrage | `README.md` | Guide inférentiel cité par `AGENTS.md` (« Démarrage, commandes et périmètre ») : prérequis (Node 22.14 minimum, 24 LTS recommandé), commandes, rubriques « Ce qui est déjà en place » et « Ce qui n'est pas implémenté », consigne de suivi des séances (`docs/conversation-N.md`). | `npm run check` : « à lancer avant chaque commit important » | lu : rubriques, prérequis, commandes et consigne de suivi des séances relevés dans le fichier local. Rien d'exécuté. |
| Requêtes REST manuelles | `backend/http/*.http` | Outil manuel de vérification de l'API. | `applications.http` | non vérifié (non exécuté). |
| Configuration npm | `.npmrc` | Guide computationnel : empêche l'exécution de scripts d'installation (évite `node-gyp` pour `better-sqlite3`). | `ignore-scripts=true` | `npm ci` exécuté avec succès ; l'effet précis du réglage n'a pas été isolé. |
| Lint | `npm run lint`, `backend/.oxlintrc.json`, `frontend/.oxlintrc.json` | Senseur computationnel. Règles : `no-explicit-any`, `eqeqeq`, `react/rules-of-hooks`, `react/exhaustive-deps`. `--deny-warnings` rend les avertissements bloquants. | `Found 0 warnings and 0 errors` (63 fichiers backend, 52 frontend) | exécuté |
| Typage | `tsc --noEmit` (backend), `tsc -b` (frontend) | Senseur computationnel. | aucune erreur | exécuté |
| Tests | `vitest run` ; `backend/tests/` (10 fichiers), `frontend/tests/` (8 fichiers) | Senseur computationnel. | 132 tests backend et 59 tests frontend passés | exécuté |
| Build | `tsc -p tsconfig.build.json` + `copyMigrations.js` ; `tsc -b && vite build` | Senseur computationnel. | `✓ built in 344ms` (60 modules) | exécuté |
| Version de Node | `backend/src/requireSupportedNode.ts`, `nodeVersion.ts`, `tests/nodeVersion.test.ts` | Senseur computationnel à l'exécution : `main.ts`, `init.ts` et `reset.ts` l'importent et refusent Node < 22.14.0. | le test refuse `22.13.1` | le test est exécuté (dans les 132). L'import au démarrage est lu dans le code, pas exécuté. |

### Ce qui n'existe pas (constats d'absence)

- **Pas de CI et pas de hook actif.** `.github/` ne contient que `pull_request_template.md` (pas de `workflows/`), et `.git/hooks` ne contient que des fichiers `.sample`. Méthode : `ls -a .github`, `ls .git/hooks`, `git ls-files | grep -iE "copilot|instruction|prompt|agent|workflow|husky"` (seul `AGENTS.md` est renvoyé). Conséquence : `npm run check` est demandé par deux guides (`AGENTS.md` et le template de PR), mais rien ne l'exécute automatiquement. Le harnais repose sur la discipline de l'auteur.
- **Pas de senseur inférentiel** (pas de revue de code par IA configurée) ni de **guide computationnel de type générateur**.
- **Angles morts de `npm run check`** : il ne lance pas `npm audit` (`npm ci` signale 1 vulnérabilité de niveau high, non traitée) et ne vérifie ni la couverture de code ni la conformité d'architecture.

### Limites de l'inventaire

- `git ls-files` ne montre que les fichiers suivis par Git : des instructions Copilot situées dans des réglages locaux (VS Code, compte GitHub) seraient invisibles.
- `.nvmrc` indique `24` alors que Node utilisé ici est `v22.18.0`. Ce n'est pas une contradiction : le README recommande Node 24 LTS et accepte 22.14 minimum (comme `engines`). Mais `.nvmrc` n'est appliqué que si quelqu'un lance `nvm use` : aucun outil ne vérifie la version recommandée.

---

## 2. Couverture des exigences

Sources : `docs/cdc_gesta_developpement.md` (§7.4, RG-03), `backend/tests/applications.test.ts` (lu en entier), `backend/src/services/applications.service.ts`, `backend/src/controllers/applications.controller.ts` et `backend/src/repositories/applications.repository.ts` (lus en entier), `backend/src/db/migrations/002_unique_active_applications.sql`.

Seed : candidatures 1 (Lucas, flotte, en cours), 2 (Inès, flotte, en cours), 3 (Mateusz, migration cloud, retenue), 4 (Léa, migration cloud, non retenue), 5 (Inès, facturation, retirée), 6 (Youssef, facturation, en cours).

### Origine des exigences (traçabilité vers l'interview et la V1 du cahier des charges)

Sources : interview numérotée (§) et cahier des charges V1 du 14 octobre 2026 (éléments E…), tels que fournis ; la version du dépôt (`docs/cdc_gesta_developpement.md`) est postérieure et porte les codes EF/RG/D.

- **EF-32 (candidater)** : l'interview dit que l'application actuelle permet aux étudiants de postuler (§2.7), que son utilité future n'est pas certaine (§2.8) et que son maintien est un point à clarifier (§9.3). La V1 en fait une question ouverte (E047) et précise qu'aucun bouton de candidature n'est spécifié avant décision (E030). C'est la décision **D-07** de la version du dépôt (« Candidatures : conservées ») qui tranche. EF-32 est donc un choix du cahier des charges final, non un besoin établi par l'interview.
- **EF-32 (retrait)** et **EF-33 (consulter ses candidatures, quatre statuts)** : dans l'interview et la V1 fournies, je n'ai trouvé aucun passage sur le retrait d'une candidature, ses statuts ou le suivi par l'étudiant (l'interview ne parle que de consultation des offres, §2.5, et de l'existence de la candidature, §2.7). Leur appui est le cahier des charges final, pas l'interview.
- **Conséquence pour les tests** : ce sont les règles du cahier des charges final (RG-03, §7.4) qui servent de référence ici, non l'interview.

### EF-32 — candidater (offre publiée, message facultatif) et retirer

| Cas | Résultat attendu | Test existant (`applications.test.ts`) | Assertions utiles | Couverture |
|---|---|---|---|---|
| Candidater avec message | 201, statut En cours | « crée une candidature avec un message facultatif » | statut 201, `toMatchObject` (offre, étudiant, message, `IN_PROGRESS`) | Couvert (réponse API ; persistance non relue) |
| Candidater sans message | 201, message `null` | « crée une candidature sans message » | 201, `message` null | Couvert |
| Offre non publiée (RG-03) | 400 `INVALID_APPLICATION` | « refuse une offre qui n'est pas publiée (400) » | statut et code | Partiel : un seul des 4 statuts non publiés testé (`E2E_TESTS`), aucune relecture de la base |
| Offre inexistante | 404 | « refuse une offre inexistante (404) » | statut, code | Couvert (réponse ; création non exclue) |
| Doublon actif (en cours ou retenue) | 400 `DUPLICATE_APPLICATION` | « refuse un doublon en cours / retenue » | statut, code | Couvert |
| Nouvelle candidature après retrait ou non-retenue (règle de la migration 002) | 201 | aucun | — | Absent |
| Corps invalide | 400 `INVALID_BODY` | « refuse un corps invalide (400) » | statut, code | Partiel : `offerId` et `message` invalides dans la même requête, donc aucun champ n'est isolé |
| Non-étudiant / sans session | 403 / 401 | tests dédiés (POST, GET, DELETE) | statut, code | Couvert |
| Retrait d'une candidature en cours | 204 puis statut `WITHDRAWN` | « retire une candidature en cours et conserve la ligne » | 204, puis `GET` avec `status === "WITHDRAWN"` | Couvert |
| Retrait d'une candidature retenue | 400 | « refuse le retrait d'une candidature retenue (400) » | statut, code | Partiel (réponse seulement, état non relu) |
| Retrait d'une candidature déjà retirée | 400 | « refuse le retrait d'une candidature déjà retirée (400) » | statut, code | Partiel (idem) |
| Retrait d'une candidature **non retenue** (la sienne) | 400 | le test de la ligne 51 appelle l'id 4 avec Mateusz (404, appartenance) | — | Absent |
| Retrait de la candidature d'un autre étudiant | 404 | deux tests (ids 2 et 4) | statut, code | Partiel (état non relu) |
| Identifiant invalide | 400 `INVALID_QUERY` | « refuse un identifiant invalide (400) » | statut, code | Couvert (hors exigence directe) |

### EF-33 — consulter ses candidatures et leur statut

| Cas | Résultat attendu | Test existant | Assertions utiles | Couverture |
|---|---|---|---|---|
| Un étudiant ne voit que les siennes | liste restreinte | « retourne uniquement les candidatures de l'étudiant… » (Inès) | `toHaveLength(2)`, `offerId` exacts, `toMatchObject` avec `studentId` | Couvert |
| Aucune candidature | `[]` | « retourne une liste vide… » (Dmytro) | `toEqual([])` | Couvert |
| Statut En cours | `IN_PROGRESS` | indirect (réponse du POST) | — | Partiel côté `GET` |
| Statut Retirée | `WITHDRAWN` | test d'Inès | `toMatchObject({ status: "WITHDRAWN" })` | Couvert |
| Statuts Retenue et Non retenue | `SELECTED`, `REJECTED` | aucun test backend | — | Absent (les libellés frontend sont testés avec des données simulées : assertions non lues) |
| Non-étudiant / sans session | 403 / 401 | tests dédiés | statut, code | Couvert |

### Comportements testés sans lien direct avec EF-32/EF-33

`GET /offers` : filtres par période, visibilité selon le profil, `hasActiveApplication` (noms de tests vus, assertions non lues). Ordre de la liste d'Inès et absence de la clé `offer_id` (assertions de `applications.test.ts`).

### Manques identifiés (par ordre d'importance)

1. **Nouvelle candidature après retrait** : la règle est écrite dans la migration (les candidatures retirées ou non retenues permettent de recandidater) mais seul le refus est testé.
2. **Un refus ne doit rien modifier** : aucun test ne relit l'état après un 400 ou un 404.
3. **Statuts Retenue et Non retenue côté API** pour EF-33.
4. **Validation du corps isolée champ par champ.**
5. **Retrait de sa propre candidature non retenue.**

### Matrice de traçabilité après ajouts (manque → test ajouté)

| Exigence | Manque traité | Test ajouté (`applications.test.ts`) | Assertions clés | Couverture après exécution |
|---|---|---|---|---|
| EF-32 | Nouvelle candidature après un retrait | « accepte une nouvelle candidature quand la précédente a été retirée, puis refuse le doublon » | 201 puis liste de 3 candidatures (statuts `IN_PROGRESS` et `WITHDRAWN` sur l'offre), puis 400 `DUPLICATE_APPLICATION` | Couvert (37 tests passés sur 37) |
| EF-32 | Un refus ne crée rien (offre non publiée, offre inexistante) | « … : refuse et ne crée rien » (2 cas) | 400 ou 404, puis `GET` → `[]` | Couvert (37 tests passés sur 37) |
| EF-32 | Validation du corps champ par champ | « refuse un corps invalide : … » (5 cas) | 400 `INVALID_BODY`, puis `GET` → `[]` | Couvert (37 tests passés sur 37) |
| EF-32 | Retrait refusé sans effet (retenue, non retenue, retirée) et candidature d'autrui intacte | « refuse de retirer sa propre candidature … et garde son statut » (3 cas) ; « laisse intacte la candidature d'un autre étudiant… » | 400 `INVALID_APPLICATION` ou 404, puis statut relu inchangé | Couvert (37 tests passés sur 37) |
| EF-33 | Les quatre statuts renvoyés par l'API | « renvoie le statut … » (4 cas) | `status` attendu et `studentId` de chaque ligne | Couvert (37 tests passés sur 37) |

---

## 3. Modifications et vérification

### État de départ (avant toute modification)

`npm run check` lancé depuis la racine, après `npm ci` (Node `v22.18.0`) :

| Contrôle | Backend | Frontend |
|---|---|---|
| lint | 0 avertissement, 0 erreur | 0 avertissement, 0 erreur |
| typecheck | OK | OK |
| tests | 132 passés (10 fichiers) | 59 passés (8 fichiers) |
| build | OK | OK |

### Tests ajoutés dans `backend/tests/applications.test.ts`

16 tests, regroupés en 5 blocs :

| Bloc | Tests | Défaut qui ferait échouer le test |
|---|---|---|
| Nouvelle candidature après un retrait | 1 | si `findActive` bloquait aussi `WITHDRAWN`, la candidature d'Inès serait refusée (400) au lieu de 201 |
| Un refus ne crée aucune candidature | 2 | un service qui insérerait avant de contrôler la publication laisserait une ligne dans la liste de Dmytro |
| Validation du corps, champ par champ | 5 | si la vérification de `message` était supprimée, le cas « message numérique » passerait en 201 |
| `GET /applications` : les quatre statuts | 4 | si le statut renvoyé était déformé ou si la liste n'était plus filtrée par étudiant, les assertions `status` et `studentId` échoueraient |
| Un retrait refusé ne modifie rien | 4 | si le retrait modifiait la ligne avant de refuser, le statut relu changerait |

### Commandes lancées et résultats

Commandes lancées à la racine du dépôt, sur la branche `semaine-3`, après l'ajout des 16 tests :

| Commande | Résultat |
|---|---|
| `npm run test -w backend -- tests/applications.test.ts` | 37 tests passés sur 37 (21 avant ajout, 16 ajoutés) |
| `npm run check` | lint : 0 avertissement, 0 erreur (63 fichiers backend, 52 frontend) ; typecheck : OK ; tests : backend 148 passés (10 fichiers), frontend 59 passés (8 fichiers) ; build : OK. Aucune régression : 132 + 16 = 148 tests backend, 59 frontend inchangés |

### Vérifications par défaut injecté

**Non réalisées pendant cette séance** : aucun défaut n'a été injecté dans le code. La colonne « Défaut qui ferait échouer le test » du tableau ci-dessus est donc un raisonnement fondé sur la lecture du code, et non une observation : on n'a pas vu ces tests échouer. Deux vérifications étaient possibles, non exécutées :

- Piste non exécutée 1 : ajouter `'WITHDRAWN'` dans la liste de statuts de `findActive` (`applications.repository.ts`). Test attendu en échec : « accepte une nouvelle candidature quand la précédente a été retirée… ».
- Piste non exécutée 2 : dans `applications.controller.ts`, remplacer la condition sur `message` par `true`. Test attendu en échec : « refuse un corps invalide : message numérique ». Le test d'origine (`offerId: "3"` **et** `message: 42`) continue de passer, ce qui illustre sa faiblesse.

### Vérifications manuelles et limites

- Non vérifié : les défauts injectés (voir ci-dessus), `backend/http/*.http`, `npm run dev`, le comportement dans le navigateur, les tests frontend (assertions non lues).
- Deux gardes du service ne sont atteignables qu'en cas d'accès concurrent : le dernier `if (!repository.withdraw(...))` du retrait et le cas `application === undefined` après `ON CONFLICT DO NOTHING` à la création. Aucun test séquentiel ne peut les atteindre sans simuler le dépôt. Non testés volontairement.
- Un test vert prouve que le comportement testé est conforme, pas que la couverture est complète. La section 2 est établie par lecture des tests et du code, sans outil de couverture.

---

## 4. Audit des guides à la lumière de Web 2

Guides examinés : `AGENTS.md` (lu en entier), `.github/pull_request_template.md` (lu en entier) et `README.md`.

Sources Web 2 : BINV2150-A « JavaScript avancé », séances 02 (requêtes HTTP, conventions REST, documentation d'API), 03 (authentification par JWT) et 04 (hachage et sécurité), slides sur https://e-vinci.github.io/BINV2150A-slides/. Les numéros de diapositives sont ceux de la vue d'ensemble de chaque séance. Les séances 01 (extensions TypeScript) et 07 à 15 (React), ainsi que BINV2150-B (ergonomie web), n'ont pas été consultées : aucune attente n'est retenue sur ces sujets (architecture en couches comme règle, migrations SQL, accessibilité, validation côté frontend), faute de source retrouvée.

| Attente ou convention de Web 2 (source) | Guide examiné (fichier et passage) | Correspondance | Écart ou ajout proposé |
|---|---|---|---|
| Documenter l'API dans un fichier Markdown, tester les routes avec REST Client (`.http`) et mettre la documentation à jour quand une route change (S02, diapos 8-9, 10, 13-14, 17-18 : « N'oubliez pas de mettre à jour la documentation et de tester vos routes ») | `AGENTS.md`, « Travail attendu » : « Mettre à jour `backend/API.md` et les fichiers `backend/http/*.http` lorsqu'un contrat API change » ; PR : même case | Oui | Aucun. JSDoc et OpenAPI (S02, diapos 11-12 et 15) sont présentés comme formats possibles ; l'exercice (diapo 17) ne rend OpenAPI qu'optionnel |
| Codes de retour HTTP : 400 données invalides, 401 non authentifié, 403 authentifié mais non autorisé, 404 ressource inexistante, **409 conflit avec l'état de la ressource, souvent un doublon** (S02, diapo 6) | `AGENTS.md`, « Travail attendu » : « les refus `400`, `401`, `403` ou `404` pertinents » | Partielle | Le guide ne cite pas 409. Or une candidature en double est refusée en `400` avec le code `DUPLICATE_APPLICATION` (service et tests « refuse un doublon »). Proposition : écrire ce choix dans le guide, ou demander à l'enseignant si 409 est attendu |
| Un `400 Bad Request` pour les données fournies invalides (S02, diapos 5-6) | `AGENTS.md` : « Les contrôleurs valident les entrées et utilisent `HttpError` » | Oui | Le guide ne demande pas de tester chaque champ invalide séparément (le test d'origine mélangeait deux champs, voir section 2) |
| Authentification (qui es-tu ?) distinguée de l'autorisation (que peux-tu faire ?) ; droits vérifiés par le serveur sur les routes protégées, `403` si non autorisé (S03, diapos 2, 12-13) | `AGENTS.md` : « Les droits doivent être vérifiés côté backend. Les permissions frontend ne servent qu'à adapter la navigation et l'affichage » ; PR : « pas seulement masqués dans l'interface » | Oui | Aucun |
| La clé secrète du JWT n'est jamais écrite dans le code ni dans Git ; chaque environnement a son fichier d'environnement, ajouté au `.gitignore` (S03, diapo 9) | `AGENTS.md` : aucun passage sur le secret JWT ni sur `backend/.env`. `README.md` : `npm run setup` crée `backend/.env` avec une clé aléatoire | Partielle | Ajouter à `AGENTS.md` : ne jamais committer `backend/.env` ni écrire le secret dans le code. Le README et le commentaire d'en-tête de `backend/.env` indiquent que ce fichier n'est pas versionné ; cela n'a pas été vérifié avec `git check-ignore`. |
| Ne jamais stocker un mot de passe en clair : le hacher avec un sel (bcrypt) (S04, diapos 2, 5-7) | `AGENTS.md` : aucun passage. Le README présente la connexion comme un mode démo (« Ce n'est pas une authentification ») | Non (sans objet aujourd'hui) | Aucun mot de passe n'est géré tant que le mode démo existe. Ajouter : « si une authentification réelle est introduite, hacher les mots de passe ». La consigne existante (« Ne pas l'activer avec `NODE_ENV=production` ») ne parle pas de hachage |
| Séparation contrôleur / service dans les exemples de code (S03, diapos 13-14 ; S04, diapos 12-15) | `AGENTS.md`, « Organisation du code » : `controllers -> services -> repositories -> SQLite` | Partielle | Le cours montre des contrôleurs qui appellent des services dans ses exemples, sans énoncer de règle ni de couche repository. Le guide va plus loin que le cours : ne pas présenter les repositories comme une attente de Web 2. Numéros de diapositives relevés sur la vue d'ensemble de chaque séance. |

Lignes retirées faute de source retrouvée dans les slides consultés : services sans dépendance à Express, évolution de la base par migrations, accessibilité du frontend, convention de tests des cas d'erreur au-delà de la diapo 18 de la S02.

### Autres constats sur les guides (hors Web 2)

- `AGENTS.md` demande `npm run check` mais aucun mécanisme ne l'applique (ni CI ni hook). Proposition : ajouter une CI qui lance `npm run check`, ou le mentionner comme limite connue dans le guide.
- Version de Node : `.nvmrc` (`24`, recommandée), `engines` et `AGENTS.md` (`>=22.14.0`, minimum) et le README disent des choses compatibles ; seul le minimum est contrôlé automatiquement (`requireSupportedNode.ts`).
- **Le README n'est plus à jour sur l'état du projet.** Dans `README.md`, la rubrique « Ce qui n'est pas implémenté » (lignes 100 à 113) contient, à la ligne 108, une entrée sur la candidature, alors que la candidature d'un étudiant et son retrait existent depuis la PR #2 (EF-32, EF-33). La rubrique « Ce qui est déjà en place » ne liste pas la candidature parmi les fonctions (seule la ligne 97 l'évoque, dans la description du schéma de la base). Méthode : `grep -n -i "candidature" README.md`. Le `git pull` de la semaine 3 n'indique aucune modification de `README.md` (il n'est pas dans les 42 fichiers changés). `AGENTS.md` renvoie justement au README pour le « périmètre » : un agent qui le suit se tromperait sur l'état du projet. Proposition : mettre cette rubrique à jour, ou retirer la liste d'avancement du README.
- `AGENTS.md` cite seulement `README.md`, `architecture.md`, `seed.md`, le cahier des charges, `API.md` et `http/` : tous existent.

Les guides n'ont pas été modifiés (audit uniquement).

---

## 5. Optionnel — senseur d'architecture (proposition, non implémentée)

**Règle vérifiée.** Un service backend n'importe pas Express (ni `Request`, ni `Response`). Elle vient de `AGENTS.md` et garde les règles métier testables sans serveur HTTP.

**Moment d'exécution.** Un test `vitest` dans `backend/tests/`, donc couvert par `npm run test` et par `npm run check`.

**Données examinées et résultat.** Le test lit les fichiers `backend/src/services/*.ts`, cherche une instruction d'import depuis `"express"`, et échoue en listant `fichier:ligne`.

**Exemple de violation.** Un `import type { Request } from "express"` ajouté dans `applications.service.ts` pour lire `req.user`.

**Faux positifs, limites, coûts.** Une chaîne ou un commentaire qui contient `express` peut déclencher le test (à atténuer en ne cherchant que les lignes d'import). Une dépendance indirecte (service → utilitaire qui importe Express) n'est pas détectée. Le test lit le disque, ce qui ajoute une dépendance à la structure des dossiers. Avant de l'implémenter : vérifier qu'il n'existe aucune violation aujourd'hui avec `grep -rn "from \"express\"" backend/src/services backend/src/repositories`.