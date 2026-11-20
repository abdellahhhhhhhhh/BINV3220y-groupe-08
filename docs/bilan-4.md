# Bilan semaine 4 du projet (séance 9) : skills, tests et hooks

## Contexte de travail

- Travail seul cette semaine : mon collègue était malade. J'ai repris le dépôt après les
  semaines précédentes de mon collègue (PR #2 et #3 fusionnées sur `main`), sur la branche
  `semaine-4`.
- Outil : GitHub Copilot dans VS Code, mode Interactive, permissions manuelles, modèle
  Copilot Fusion (routé automatiquement, gpt-5.6-luna dans mes essais).
- Crédits IA : j'ai utilisé 10 crédits cette séance (Copilot a affiché 2,2 crédits pour la
  rédaction des tests de la recherche et 3,4 crédits pour l'implémentation). Le nombre de
  crédits de mon collègue n'est pas connu au moment de la rédaction de ce bilan.

## 1. Audit des tests des candidatures (EF-32 et EF-33)

Skill installé : `test-gap-audit` (dépôt `github/awesome-copilot`), copié dans
`.github/skills/test-gap-audit/`, rechargé avec `/skills reload`. Il est apparu dans la liste
après `/`. Commande envoyée : `/test-gap-audit les tests des candidatures (EF-32 et EF-33)`
avec les décisions métier (doublon actif refusé, recandidature après retrait, 404 pour la
candidature d'un autre étudiant).

Déroulement observé : Copilot a lu le skill, lancé `scripts/coverage_map.py`
(89 fichiers source, 23 fichiers de test, 22 correspondances heuristiques), lu les services,
repositories, contrôleurs, la migration et les tests, puis exécuté les tests ciblés
(37 tests backend et 13 tests frontend passent). Il n'a modifié aucun fichier. Le script
repère des pistes, l'agent les vérifie en lisant le code et en exécutant les tests.

| Cas | Test existant (selon le rapport de Copilot) | Constat |
|---|---|---|
| Doublon En cours ou Retenue | `applications.test.ts:205` | Couvert |
| Recandidature après retrait | `applications.test.ts:214` | Couvert |
| 404 pour la candidature d'un autre étudiant | `applications.test.ts:37` | Couvert |
| Statut inchangé après refus du retrait | `applications.test.ts:289` | Couvert |
| Index unique SQL des candidatures actives (P2) | aucun | **Manque confirmé** : une recherche de `applications` dans `backend/tests/db/constraints.test.ts` ne renvoie rien |
| Refus 400 de doublon côté interface (P2) | aucun | **Manque confirmé** : `grep -i "DUPLICATE" frontend/tests/OffersPage.test.tsx` ne renvoie rien. Je n'ai pas ajouté de test pour ce cas |

Limite : les lignes des quatre tests « couverts » viennent du rapport de Copilot ; je n'ai
pas relu chaque assertion une par une. Copilot signale aussi qu'il n'a pas testé de vraie
concurrence.

Test ajouté (manque n°1) : dans `backend/tests/db/constraints.test.ts`,
« refuse les doublons actifs mais conserve les doublons historiques ». Il vérifie qu'une
seconde candidature `IN_PROGRESS` pour la même paire étudiant/offre lève une erreur UNIQUE,
qu'une candidature `IN_PROGRESS` est refusée quand une candidature `SELECTED` existe, et que
`WITHDRAWN` et `REJECTED` n'entraînent aucune erreur. Il est passé directement au vert, parce
que l'index existait déjà dans la migration `002_unique_active_applications.sql` : il
protège contre une régression, il ne révèle pas de défaut. Je n'ai pas vérifié qu'il échoue
si l'index est modifié.

## 2. Recherche d'offres par titre (EF-30) avec le TDD

### Installation

- Skill `test-driven-development` du dépôt `obra/superpowers`, copié dans
  `.github/skills/test-driven-development/` avec `writing-good-tests.md` et `LICENSE`.
- Ajout, juste après l'en-tête YAML de `SKILL.md`, de la consigne demandant de préparer et
  d'exécuter un petit lot de tests, puis d'attendre ma validation explicite avant de modifier
  le code. Le skill n'a pas `disable-model-invocation: true`.
- Ajout du paragraphe sur le TDD dans `.github/copilot-instructions.md` (5 lignes ajoutées,
  commit `26e9c2f`, avec le skill). Le projet a aussi un `AGENTS.md` à la racine, issu de
  `/init`.
- `/skills reload` puis nouveau chat.

### Demande et déclenchement

J'ai donné à Copilot les six règles de recherche, sans écrire `/` et sans parler de tests
ni de TDD. Le skill s'est déclenché seul : Copilot a écrit des tests dans
`backend/tests/offers.test.ts` et `frontend/tests/OffersPage.test.tsx`, les a exécutés puis
s'est arrêté en me demandant de les valider, sans toucher au code de l'application.

### Étape rouge

- Backend : 3 échecs attendus, parce que le paramètre `q` était ignoré :
  - « recherche une expression insensible à la casse dans le titre et combine la période » ;
  - « conserve la visibilité publiée pour un étudiant lors d'une recherche » ;
  - « retourne une liste vide lorsqu'aucun titre ne correspond ».
- Frontend : 2 échecs attendus, parce que le champ « Recherche » n'existait pas :
  - « recherche par expression dans le titre et combine la période » ;
  - « affiche un message adapté lorsqu'aucune offre ne correspond à la recherche ».
- Les échecs viennent de la fonctionnalité manquante, pas d'une erreur de syntaxe ou d'import.

### Ma relecture avant validation

J'ai comparé les tests aux six règles. Deux manques repérés : aucun test de recherche vide ou
composée d'espaces, et le test de visibilité ne prouvait pas qu'une offre non publiée dont le
titre correspond est cachée à l'étudiant. J'ai demandé à Copilot d'ajouter ces deux tests
avant d'implémenter :
« ignore une recherche vide ou composée d'espaces » (deux variantes) et
« n'expose pas à un étudiant une offre non publiée correspondant à la recherche ». Ils sont
passés directement au vert, car ils protègent des règles déjà en place.
J'ai relevé aussi que le test frontend impose le format exact de l'URL
(`/api/offers?q=API%20REST&period=P2`), ce qui contraint l'implémentation.

J'ai ensuite répondu « Je valide les tests. Tu peux implémenter. »

### Après l'implémentation

- Copilot a modifié 10 fichiers : documentation de l'API, `offers.http`, contrôleur, service
  et repository des offres côté backend, hook, service et page des offres côté frontend,
  et les deux fichiers de tests. Aucun nouveau paquet, `package-lock.json` inchangé.
- `npm run check` lancé par moi : lint 0 avertissement, typecheck et build OK.

| | Début de séance | Après l'audit | Fin |
|---|---|---|---|
| Tests backend | 148 | 149 | 155 |
| Tests frontend | 59 | 59 | 61 |

- Essais dans le navigateur, tous concluants : recherche en minuscules, en majuscules, avec
  des espaces autour du texte, sans résultat (message adapté affiché), champ vidé (retour à
  la liste complète), combinaison avec le filtre par période, avec un compte étudiant et
  avec un compte administrateur (offres non publiées correspondantes visibles).

### Problèmes et limites

- Les tests de la recherche ont été commités séparément après l'implémentation, pas avant :
  la preuve de l'étape rouge repose sur les sorties de Copilot (3 échecs backend, 2 échecs
  frontend) et non sur un commit antérieur.
- Je n'ai pas vérifié comment le code traite les caractères `%` et `_` (jokers de `LIKE`)
  dans la recherche.
- Je n'ai pas relancé un audit limité aux tests de la recherche (facultatif).

## 3. Hook Tool Guardian

Partie facultative, non réalisée faute de temps. Le dossier `tool-guardian` de Moodle a été
téléchargé et le script `guard-tool.cjs` lu : il répond `deny` quand la commande contient une
suppression de `demo-protected.txt`, et `{}` sinon. Le hook n'a pas été installé ni testé
dans Copilot.

## 4. Ce que j'ai retenu

- Un skill est un dossier d'instructions (`SKILL.md` et ressources) que Copilot ne charge que
  lorsque sa description correspond à la tâche. C'est un chargement progressif, qui ménage la
  fenêtre de contexte.
- Le TDD n'a de valeur que si les tests sont vus en échec pour la bonne raison, puis relus par
  moi : ma relecture a révélé deux manques que Copilot n'avait pas couverts.
- Un audit de tests produit des constats à vérifier, pas des certitudes : Copilot peut se
  tromper, et le skill ne prouve pas que le TDD a été respecté.

## Fichiers remis

- Conversations exportées : `docs/conversation-4.md` (audit et recherche TDD).
- Ce bilan.

## Bilan réflexif

**Qu'ai-je appris ?** Un skill est un dossier de consignes que Copilot ne charge que quand
sa description correspond à la tâche. Un audit de tests donne des pistes à vérifier, pas des
vérités, et le TDD n'a de valeur que si les tests sont vus en échec pour la bonne raison.

**Qu'est-ce qui a bien fonctionné ?** Le skill TDD s'est déclenché tout seul et s'est arrêté
pour me demander de valider les tests. Ma relecture a révélé deux cas manquants (recherche
vide, offre non publiée cachée à l'étudiant) avant l'implémentation. L'audit a désigné un
vrai manque (index SQL non testé) que j'ai pu confirmer moi-même.

**Qu'est-ce qui a moins bien fonctionné ?** Les tests de la recherche n'ont pas été commités
avant l'implémentation, donc l'étape rouge repose sur les sorties de Copilot. Je n'ai pas
eu le temps de faire la partie hook. J'ai aussi perdu du temps avec des erreurs de collage
dans le terminal (un dépôt téléchargé au mauvais endroit, corrigé ensuite).
