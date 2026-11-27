# Bilan global du projet Gesta

## Ce que j'ai appris

### Travailler avec un agent de codage

- **Un agent est un outil, pas un oracle.** Tout au long du projet, GitHub Copilot m'a fait gagner du temps, mais ses affirmations ne valent rien tant que je ne les ai pas vérifiées moi-même. Un « test réussi » dans le chat ne prouve rien : il faut voir le navigateur piloté, la sortie du terminal ou le diff.
- **Plus la consigne est précise, meilleur est le résultat.** Donner le contexte (fichiers à lire, règles métier), des contraintes explicites (« ne modifie pas le code applicatif », « n'utilise pas MCP ») et un format attendu a nettement amélioré ce que je recevais. Quand Copilot sortait du cadre, c'était presque toujours parce que ma consigne laissait un trou.
- **Travailler par petites étapes avec des points d'arrêt.** Un prompt par étape, vérifié avant de passer à la suivante, évite de découvrir trop tard qu'une erreur s'est propagée.
- **Les fichiers d'instructions orientent l'agent.** Le fichier `.github/copilot-instructions.md` et `AGENTS.md` (créé avec `/init`) donnent à l'agent les conventions du dépôt. J'ai aussi vu que ces règles peuvent entrer en conflit avec une tâche (le workflow TDD s'activait alors qu'il ne fallait pas), et qu'il faut alors le préciser dans le prompt.
- **Les limites de l'agent sont réelles.** Sa sandbox ne peut pas lancer le navigateur de Playwright : j'ai dû exécuter moi-même les tests et lui rapporter les résultats. J'ai aussi appris à surveiller la consommation de crédits.

### Skills et TDD

- Un **skill** est un dossier d'instructions (`SKILL.md` et ressources) que Copilot ne charge que lorsque sa description correspond à la tâche. C'est un chargement progressif qui ménage la fenêtre de contexte.
- J'ai installé `test-gap-audit` et `test-driven-development`. L'audit m'a désigné un vrai manque (l'index SQL des candidatures actives n'était pas testé), que j'ai pu confirmer moi-même.
- **Le TDD n'a de valeur que si les tests sont vus en échec pour la bonne raison.** Ma relecture des tests avant validation a révélé deux cas que Copilot n'avait pas couverts (recherche vide, offre non publiée cachée à l'étudiant).
- Un audit de tests produit des pistes à vérifier, pas des certitudes.

### MCP et tests end-to-end avec Playwright

- **MCP (Model Context Protocol)** permet à un client comme Copilot de découvrir et d'appeler les outils d'un serveur. Avec le serveur Playwright MCP lancé en local, l'agent a pu piloter un vrai navigateur : ouvrir l'application, se connecter, saisir une recherche et lire l'état de la page. J'ai compris la différence entre un serveur local (comme ici, sur `localhost`) et un serveur distant, qui peut demander une authentification.
- **L'exploration interactive et le test automatisé sont complémentaires.** MCP sert à explorer et à comprendre un comportement ; Playwright Test conserve des vérifications exécutables sans agent, donc reproductibles (utiles aussi pour une chaîne CI/CD).
- **Un test doit pouvoir détecter un défaut.** En désactivant temporairement le filtrage de la recherche, j'ai vérifié que le test échouait à cause du défaut et non d'une erreur de configuration, puis qu'il repassait après restauration.
- **Définir les scénarios avant de générer les tests** (état initial, actions, résultat observable) oblige à réfléchir au comportement attendu. Choisir comme cas limite une offre non publiée m'a fait comprendre qu'un test peut protéger une règle de sécurité (ne pas montrer à l'étudiant des offres non publiées).

### Le projet et le code

- J'ai travaillé sur une application complète : frontend React/TypeScript/Vite, backend Node.js/Express/TypeScript, base SQLite avec migrations en SQL, validation par type guards, droits contrôlés côté serveur, et des données de démonstration cohérentes.
- J'ai pratiqué les **tests à plusieurs niveaux** : Vitest et Supertest côté backend, Testing Library côté frontend, puis tests de bout en bout.
- J'ai appris à lire un cahier des charges et à le traduire en règles de gestion testables.

### Git et travail en équipe

- Chaque semaine : une branche, des commits clairs, une pull request, une fusion dans `main`. J'ai appris à récupérer le travail d'un collègue avec `git fetch` et `git pull`, à lire un historique avec `git log --graph --all`, et à restaurer un fichier modifié temporairement.
- J'ai aussi appris à relire un diff avant de commiter : aucun défaut temporaire, aucun secret, aucun fichier parasite (traces MCP, résultats de tests, installation au mauvais endroit).
- Quand mon collègue était absent, j'ai dû reprendre le dépôt seul, ce qui m'a montré l'importance d'un dépôt propre et d'une documentation à jour.

### Mes erreurs, et ce qu'elles m'ont appris

- Playwright installé dans le mauvais dossier (`e2e/` au lieu de la racine) : deux versions et une erreur peu lisible. Leçon : vérifier **où** on lance une commande d'installation.
- Des erreurs de collage dans le terminal et de commandes mal enchaînées. Leçon : lire chaque sortie avant de continuer.
- Une erreur de syntaxe laissée dans un test généré. Leçon : relire le code produit par l'agent, ligne par ligne.

## Ce que je n'ai pas appris mais que j'aurais aimé apprendre

- **Les hooks** (par exemple Tool Guardian) : j'ai lu le script, mais je n'ai jamais pu l'installer ni le tester dans Copilot, faute de temps.
- **Les tests de concurrence et de limites d'entrée** : je n'ai pas vérifié le traitement des caractères `%` et `_` dans la recherche, ni le comportement de l'application sous des requêtes simultanées.
- **L'intégration continue** : lancer les tests Playwright automatiquement à chaque PR avec GitHub Actions et démarrer l'application dans cette chaîne, avec `webServer`.
- **Mesurer la qualité des tests** : outils de couverture et tests de mutation pour vérifier que les tests détectent vraiment des défauts, au-delà d'un seul défaut introduit à la main.
- **Les autres types de serveurs MCP** : serveurs distants avec authentification, ou écrire mon propre serveur MCP.
- **Comparer plusieurs modèles et agents** de façon méthodique (coût, qualité, rapidité) pour choisir le bon outil selon la tâche.
- **Déployer l'application** : la connexion réelle par lien envoyé par e-mail n'est pas implémentée, et je n'ai pas vu comment passer d'un mode démo à un déploiement sécurisé.