# API Gesta

Toutes les réponses sont en JSON. En développement, le frontend appelle `/api/...` et le
proxy Vite transmet la requête au backend sans le préfixe `/api`.

Les requêtes d'exemple se trouvent dans `http/` (extension REST Client de VS Code).

## Authentification

Les routes protégées exigent l'en-tête `Authorization` contenant le jeton obtenu à la
connexion (sans préfixe). Le jeton ne contient que l'identité (`kind`, `id`) ; à chaque
requête, le backend relit en base le compte, ses rôles et ses entreprises. Un compte
désactivé, ou un contact sans rôle, ne peut plus accéder à l'API.

> **Mode démo.** La connexion réelle par lien envoyé par e-mail (CdC EF-01) n'est pas
> implémentée. En développement local, `DEMO_AUTH_ENABLED=true` permet de se connecter
> **sans mot de passe** sous un utilisateur fictif. Ce n'est pas une authentification :
> le serveur refuse de démarrer avec ce mode si `NODE_ENV=production`.

## Format des erreurs

Toute erreur a la même forme :

```json
{ "error": { "code": "INVALID_QUERY", "message": "Le paramètre q doit apparaître une seule fois" } }
```

| Statut | Code | Cas |
|---|---|---|
| 400 | `INVALID_QUERY` | Paramètre de requête invalide |
| 400 | `INVALID_BODY` | Corps de requête invalide |
| 401 | `UNAUTHENTICATED` | Session absente, expirée ou invalide ; compte non autorisé à se connecter |
| 403 | `FORBIDDEN` | Utilisateur connecté, mais sans droit sur la ressource |
| 404 | `NOT_FOUND` | Route inconnue |
| 500 | `INTERNAL_ERROR` | Erreur inattendue du serveur |

## GET /health

Indique que l'API répond.

### Réponses

- `200` : `{ "status": "ok" }`

## GET /auth/demo-users

*Mode démo uniquement.* Liste les utilisateurs qui peuvent se connecter : comptes actifs,
et contacts ayant au moins un rôle.

### Réponses

- `200` : tableau d'utilisateurs (même format que `GET /auth/me`)
- `404` : mode démo désactivé

## POST /auth/demo-login

*Mode démo uniquement.* Ouvre une session sous l'identité choisie, sans mot de passe.

### Requête

- Body JSON : `{ "kind": "ADMIN" | "STUDENT" | "CONTACT", "id": 4 }`

### Réponses

- `200` : `{ "token": "…", "user": { … } }`
- `400` `INVALID_BODY` : `kind` inconnu ou `id` qui n'est pas un entier positif
- `401` `UNAUTHENTICATED` : utilisateur inexistant, inactif, à vérifier, ou contact sans rôle
- `404` : mode démo désactivé

## GET /auth/me

Retourne l'utilisateur connecté.

### Requête

- Header `Authorization` obligatoire

### Réponses

- `200` :

```json
{
  "kind": "CONTACT",
  "id": 4,
  "firstName": "Julien",
  "lastName": "Lambert",
  "email": "julien.lambert@lumen.test",
  "roles": ["DEPOSITOR", "PROMOTER", "SIGNATORY"],
  "companies": [
    { "id": 3, "shortName": "Lumen Data" },
    { "id": 2, "shortName": "Lumen Digital" }
  ]
}
```

`roles` et `companies` sont vides pour un administrateur ou un étudiant.

- `401` `UNAUTHENTICATED` : jeton absent, invalide ou expiré, ou compte désactivé

## GET /companies

Liste les entreprises, triées par nom complet. Un administrateur voit toutes les
entreprises ; les autres utilisateurs ne voient que les entreprises actives.

### Requête

- Header `Authorization` obligatoire
- Paramètre facultatif `q` : texte cherché dans le nom complet et le nom abrégé, sans tenir
  compte de la casse. Une valeur vide est ignorée. 100 caractères au maximum.

### Réponses

- `200` : tableau d'entreprises

```json
[
  {
    "id": 2,
    "name": "Lumen Digital SRL",
    "shortName": "Lumen Digital",
    "locality": "Louvain-la-Neuve",
    "status": "ACTIVE"
  }
]
```

`status` vaut `ACTIVE`, `TO_VERIFY` (fiche à vérifier) ou `ARCHIVED`.

- `400` `INVALID_QUERY` : `q` est répété ou dépasse 100 caractères.
- `401` `UNAUTHENTICATED` : session absente ou invalide.

## GET /offers

Liste les offres visibles par l'utilisateur connecté, de l'année académique la plus
récente à la plus ancienne, puis de la plus récente à la plus ancienne.

| Profil | Offres retournées |
|---|---|
| Administrateur | Toutes |
| Étudiant | Les offres publiées |
| Contact déposant | Les offres qu'il a déposées, quel que soit leur statut |
| Contact sans rôle de déposant | Aucun accès (403) |

### Requête

- Header `Authorization` obligatoire

### Réponses

- `200` : tableau d'offres

```json
[
  {
    "id": 3,
    "title": "API REST de facturation",
    "companyShortName": "Orbis",
    "academicYear": "2026-2027",
    "period": "P2",
    "status": "PUBLISHED",
    "hasActiveApplication": true
  }
]
```

`period` vaut `P1`, `P2` ou `OTHER`. `status` vaut `SUBMITTED` (soumise), `PENDING`
(en attente), `PUBLISHED` (publiée), `ASSIGNED` (attribuée) ou `ARCHIVED` (archivée).
Pour un étudiant, `hasActiveApplication` indique qu'une candidature `IN_PROGRESS`
ou `SELECTED` existe pour l'offre. Ce champ n'est pas renvoyé aux autres profils.

- `401` `UNAUTHENTICATED` : session absente ou invalide.
- `403` `FORBIDDEN` : contact seulement promoteur ou signataire.

## POST /applications

Permet à un étudiant connecté de candidater à une offre publiée. Le serveur
détermine l'étudiant à partir de la session ; `studentId` ne peut pas être fourni
par le client.

### Requête

- Header `Authorization` obligatoire
- Body JSON :

```json
{
  "offerId": 3,
  "message": "Je souhaite approfondir la conception d'API."
}
```

`message` est facultatif et peut être `null`. Une candidature `IN_PROGRESS` ou
`SELECTED` existe au plus une fois pour un même étudiant et une même offre. Une
candidature `WITHDRAWN` ou `REJECTED` est conservée et n'empêche pas une
nouvelle candidature.

### Réponses

- `201` :

```json
{
  "id": 7,
  "offerId": 3,
  "studentId": 8,
  "message": "Je souhaite approfondir la conception d'API.",
  "status": "IN_PROGRESS",
  "appliedAt": "2026-11-06 18:47:00"
}
```

- `400` `INVALID_BODY` : `offerId` absent ou invalide, ou `message` qui n'est
  pas une chaîne ou `null`.
- `400` `INVALID_APPLICATION` : l'offre n'est pas publiée.
- `400` `DUPLICATE_APPLICATION` : l'étudiant a déjà une candidature en cours
  ou retenue pour cette offre.
- `401` `UNAUTHENTICATED` : session absente ou invalide.
- `403` `FORBIDDEN` : l'utilisateur connecté n'est pas un étudiant.

## DELETE /applications/:id

Retire la candidature indiquée si elle appartient à l'étudiant connecté et est
encore `IN_PROGRESS`. La ligne est conservée et son statut devient `WITHDRAWN`.

### Requête

- Header `Authorization` obligatoire
- Paramètre de chemin `id` : identifiant entier positif de la candidature

### Réponses

- `204` : candidature retirée, sans contenu.
- `400` `INVALID_QUERY` : `id` n'est pas un entier positif.
- `400` `INVALID_APPLICATION` : la candidature a déjà été traitée.
- `401` `UNAUTHENTICATED` : session absente ou invalide.
- `403` `FORBIDDEN` : l'utilisateur connecté n'est pas un étudiant.
- `404` `NOT_FOUND` : candidature inexistante ou appartenant à un autre étudiant.
- `404` `NOT_FOUND` : offre inexistante.

## GET /applications

Retourne les candidatures de l'étudiant connecté, avec le statut et les
informations de l'offre. Le serveur filtre toujours sur l'identifiant de
l'étudiant issu de la session.

### Requête

- Header `Authorization` obligatoire

### Réponses

- `200` :

```json
[
  {
    "id": 1,
    "offerId": 1,
    "studentId": 1,
    "message": "Le développement React m'intéresse particulièrement.",
    "status": "IN_PROGRESS",
    "appliedAt": "2026-10-02 18:10:00",
    "offer": {
      "title": "Application React de gestion de flotte",
      "companyShortName": "Lumen Digital",
      "academicYear": "2026-2027",
      "period": "P2"
    }
  }
]
```

`status` vaut `IN_PROGRESS` (En cours), `SELECTED` (Retenue), `REJECTED`
(Non retenue) ou `WITHDRAWN` (Retirée).

- `401` `UNAUTHENTICATED` : session absente ou invalide.
- `403` `FORBIDDEN` : l'utilisateur connecté n'est pas un étudiant.
