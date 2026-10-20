# Gesta

## Démarrage et vérifications

- Exécuter les commandes de workspace depuis la racine du dépôt, pas depuis `frontend/` ou `backend/`.
- Installation et premier démarrage : `npm ci`, puis `npm run setup`, puis `npm run dev`.
- `npm run dev` lance l'API sur `http://localhost:3000` et Vite sur `http://localhost:5173`.
- Node.js doit être en version `>=22.14.0`.
- Avant une modification importante, exécuter `npm run check` (lint, typecheck, tests et build).
- Le mode démo est réservé au développement local. Ne pas l'activer avec `NODE_ENV=production`.

## Organisation du code

- Le backend est organisé en `controllers -> services -> repositories -> SQLite`, avec les conversions dans `mappers/`.
- Les services backend portent les règles métier et ne dépendent pas d'Express (`Request`/`Response`).
- Les contrôleurs valident les entrées et utilisent `HttpError`; `errorHandler` produit les erreurs JSON communes.
- Les droits doivent être vérifiés côté backend. Les permissions frontend ne servent qu'à adapter la navigation et l'affichage.
- Le frontend suit `pages -> hooks -> services/utils -> models`, avec des composants réutilisables dans `components/`.
- Les services frontend valident les réponses API avec les type guards existants.

## Base de données

- Pour une évolution de schéma, ajouter une nouvelle migration SQL numérotée dans `backend/src/db/migrations/`; ne pas modifier une migration déjà appliquée.
- Les tests backend utilisent une base SQLite en mémoire; ne pas utiliser la base locale de développement dans les tests.
- `npm run db:reset` exige l'arrêt préalable du serveur, en particulier sous Windows.

## Documentation de référence

- Démarrage, commandes et périmètre : [README.md](README.md)
- Architecture et parcours de référence : [docs/architecture.md](docs/architecture.md)
- Données de démonstration : [docs/seed.md](docs/seed.md)
- Exigences métier : [docs/cdc_gesta_developpement.md](docs/cdc_gesta_developpement.md)
- Contrat HTTP : [backend/API.md](backend/API.md)
- Requêtes REST manuelles : [backend/http/](backend/http/)

## Travail attendu

- Pour une fonctionnalité métier, relier l'implémentation à l'exigence `EF-xx` ou `RG-xx` correspondante.
- Ajouter ou mettre à jour les tests backend et frontend du comportement modifié, y compris les refus `400`, `401`, `403` ou `404` pertinents.
- Mettre à jour `backend/API.md` et les fichiers `backend/http/*.http` lorsqu'un contrat API change.
- Préserver les conventions existantes, les imports backend terminés par `.ts` et les codes de statut stockés en anglais.