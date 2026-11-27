# Semaine 5 — Recherche d’offres : MCP et Playwright Test

## 1. Scénarios

Les scénarios de référence sont décrits dans [e2e/recherche-offres/scenarios.md](../e2e/recherche-offres/scenarios.md).

Les deux cas couvrent des résultats complémentaires :

- Le scénario 1 vérifie une recherche positive avec `api rest` en minuscules : seule l’offre « API REST de facturation » d’Orbis doit rester visible, avec un compteur de « 1 offre ».
- Le scénario 2 recherche `portail`, titre d’une offre soumise qui ne doit pas être visible pour l’étudiant. Il vérifie l’absence de résultat et le message correspondant.

## 2. MCP

Le scénario exécuté avec le navigateur MCP est le **scénario 1**. Le résultat observé correspond aux attentes : après connexion en tant que Lucas Dupont, la liste initiale affichait quatre offres ; après saisie de `api rest`, seule « API REST de facturation » (Orbis) était affichée et le compteur indiquait « 1 offre ».

Appels d’outils observés et retours :

1. **Navigation** (affiché « Navigate to a URL » dans Copilot) avec l'argument `url: "http://localhost:5173"`. Il a ouvert l'application dans le navigateur piloté ; l'instantané de page qui a suivi a montré l'écran de connexion de démo avec la liste des utilisateurs.
2. **Clic** (affiché « Click ») avec `element: "le bouton Lucas Dupont dans le groupe Étudiants"` et la référence `target: "e30"`. Il a connecté l'étudiant ; l'instantané suivant a montré l'interface étudiante. Un second clic (`e123`, lien « Offres ») a ouvert la liste, qui affichait 4 offres.
3. **Saisie** (affiché « Fill form ») avec le champ `Recherche` (`target: "e138"`) et `value: "api rest"`. L'instantané suivant a montré une seule offre, « API REST de facturation », et le compteur « 1 offre ».

Entre chaque action, Copilot a appelé l'outil d'instantané de page (« Page snapshot »), qui renvoie l'arbre d'accessibilité de la page avec des références (`e30`, `e123`, `e138`) utilisées ensuite pour cibler les éléments.

## 3. Playwright Test

Le fichier de test créé est [e2e/recherche-offres/recherche-offres.spec.ts](../e2e/recherche-offres/recherche-offres.spec.ts). Il contient un test nommé pour chacun des scénarios. Ils utilisent l’interface, se connectent comme Lucas Dupont et vérifient d’abord les quatre offres publiées de la base de démo ainsi que l’absence de l’offre soumise. Ils ne réalisent aucune écriture en base ; les données attendues sont celles obtenues après `npm run db:reset`.

Principales assertions :

- Scénario 1 : compteur initial « 4 offres », présence de l’offre recherchée et de l’entreprise Orbis, absence des trois autres offres publiées après filtrage, puis compteur « 1 offre ».
- Scénario 2 : absence du compteur quand la liste est vide, absence des offres publiées et de l’offre soumise, et message exact « Aucune offre ne correspond à votre recherche. »

Résultats des exécutions :

- Installation préalable : `npx playwright install chromium` ; aucune sortie n’a été affichée avant le lancement des tests.
- Première exécution de `npx playwright test` : 2 tests réussis, 0 échec, 1 worker (`2 passed (3.7s)`). Scénario 1 : 976 ms ; scénario 2 : 840 ms.
- Deuxième exécution successive de `npx playwright test` : 2 tests réussis, 0 échec, 1 worker (`2 passed (1.5s)`). Scénario 1 : 407 ms ; scénario 2 : 392 ms.
- `npm run check` : réussi ; lint avec 0 avertissement, typecheck OK, Vitest : backend 155 tests et frontend 61 tests, build OK. Ce script ne lance pas les tests E2E Playwright.

## 4. Vérification

Un défaut temporaire a été introduit dans `backend/src/controllers/offers.controller.ts` : le paramètre `q` était encore validé, mais sa valeur n’était plus transmise au service, désactivant ainsi le filtrage par titre. Le code initial a ensuite été restauré. Après restauration, `git diff` ne présentait aucun changement suivi.

- Avec le défaut temporaire, `npx playwright test` a échoué pour les 2 tests :
  - Scénario 1 — `Error: expect(locator).toBeVisible() failed` pour `getByText('1 offre', { exact: true })` ; attendu visible, mais `Error: element(s) not found`.
  - Scénario 2 — `Error: expect(locator).toHaveCount(expected) failed` pour `getByText(/^\d+ offres?$/)` ; attendu 0, reçu 1.
- Après restauration du contrôleur, `npx playwright test` a réussi : 2 tests réussis, 0 échec (`2 passed (2.6s)`), scénarios 1 et 2.

## 5. Comparaison

### a) Que permet Playwright MCP dans la conversation avec l’agent ? Quelle action précise est passée par un outil MCP ?

Playwright MCP permet à l’agent d’interagir avec le navigateur et d’observer l’état de l’interface dans la conversation. Ici, l’agent a utilisé les outils MCP pour ouvrir l’application, cliquer sur « Lucas Dupont » puis « Offres », et saisir `api rest` dans le champ de recherche.

### b) Qu’apportent les scripts Playwright Test que le compte rendu d’un test par MCP n’apporte pas ?

Les scripts conservent les étapes et assertions sous forme de tests réexécutables. Ils peuvent détecter une régression lors d’exécutions ultérieures ; le compte rendu MCP décrit le résultat d’une interaction ponctuelle observée dans la conversation.

### c) Dans quel cas préférer une exploration interactive avec MCP, et dans quel cas un test automatisé ?

Préférer MCP pour explorer une interface, comprendre un parcours ou observer un comportement de façon interactive. Préférer un test automatisé pour vérifier de manière répétable un comportement connu et ses résultats attendus.
