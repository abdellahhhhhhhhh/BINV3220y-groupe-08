# Bilan — semaine 3 : harnais agentique

Projet Gesta (BINV3220y, groupe 08). Travail réalisé sur la branche `semaine-3`, à partir de `main` au commit `dc38690`.

## Ce qui a été fait

- **Matrice 1** (`matrice-1-guides-senseurs-web2.md`) : inventaire des guides et des senseurs du dépôt, classés en guide/senseur et inférentiel/computationnel, puis comparaison des guides avec les bonnes pratiques de Web 2 (séances 02, 03 et 04 du cours BINV2150-A).
- **Matrice 2** (`matrice-2-tracabilite-tests.md`) : traçabilité entre les exigences EF-32 et EF-33 et les tests existants. Cinq manques ont été identifiés et **16 tests** ont été ajoutés dans `backend/tests/applications.test.ts`.
- **Conversation** (`conversation-3.md`) : échange avec l'assistant IA utilisé pour ce travail.

## Ce qui a été vérifié

- `npm run check` lancé à la racine, avant et après les ajouts : lint, typecheck, tests et build passent.
- Tests backend : 132 avant, **148** après (16 ajoutés, aucune régression). Tests frontend : 59, inchangés.
- Les fichiers `AGENTS.md`, `.github/pull_request_template.md`, `README.md`, les services, contrôleurs et dépôts de candidatures et les tests existants ont été lus dans le dépôt.

## Ce qui n'a pas été vérifié

- Aucun défaut n'a été injecté dans le code pour voir échouer les nouveaux tests : les défauts décrits dans la matrice 2 sont des raisonnements issus de la lecture du code.
- `backend/http/*.http`, `npm run dev` et le comportement dans le navigateur n'ont pas été testés.
- Les tests frontend ont été exécutés, mais leurs assertions n'ont pas été lues.

## Constats principaux

- Aucune CI ni hook Git n'impose `npm run check`, alors que `AGENTS.md` et le template de PR le demandent.
- Le `README.md` liste encore « candidature d'un étudiant et retrait d'une candidature » parmi les fonctions non implémentées, alors qu'elles existent depuis la PR #2.
- Une candidature en double est refusée avec un code `400` (`DUPLICATE_APPLICATION`), alors que le cours (S02, diapo 6) associe le doublon au code `409`. À confirmer avec l'enseignant.
- Les tests existants vérifiaient surtout la réponse HTTP, pas l'état des données après un refus ; la règle « on peut recandidater après un retrait » n'était pas testée.

## Usage de l'IA

L'assistant IA (Claude) a proposé la méthode, rédigé le brouillon des matrices et les 16 tests ajoutés, et aidé à interpréter les sorties de commandes. Les commandes ont été lancées par Abdellah, qui a fourni les sorties, ouvert les fichiers du dépôt et validé que les tests passent. Les numéros de diapositives de l'audit Web 2 ont été relevés sur la vue d'ensemble des slides.
