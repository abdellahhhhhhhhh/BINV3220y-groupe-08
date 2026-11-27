# Scénarios — recherche d’offres par titre (EF-30)

## Contexte commun

- Frontend : http://localhost:5173
- Utiliser la base de données de démonstration. Pour la recréer avec les données décrites ici, arrêter le serveur puis exécuter `npm run db:reset` à la racine du dépôt.
- La recherche porte sur le titre, ne distingue pas les majuscules des minuscules et ignore les espaces autour du texte saisi. Une recherche vide ou composée d’espaces n’applique pas de filtre.
- Le profil étudiant ne voit que les offres publiées : une offre soumise reste invisible, même si son titre correspond à la recherche.
- Parcours de connexion à suivre dans chaque scénario : ouvrir l’URL ci-dessus ; sur l’écran « Connexion de démonstration », dans le groupe « Étudiants », cliquer sur le bouton « Lucas Dupont » (aucun mot de passe n’est demandé) ; dans la navigation, cliquer sur « Offres » ; dans le champ « Recherche », saisir le texte indiqué.

## Scénario 1 — Recherche avec résultat

### État initial

- Compte à utiliser : étudiant **Lucas Dupont** (id étudiant 1).
- Avant la recherche, cet étudiant voit les offres publiées suivantes :
  - « Application React de gestion de flotte » — Lumen Digital, Publiée.
  - « API REST de facturation » — Orbis, Publiée.
  - « Tableau de bord de qualité des données » — Lumen Data, Publiée.
  - « Assistant conversationnel interne » — Nexalis, Publiée.
- « Refonte du portail client » — Lumen Digital, Soumise ; cette offre n’est pas visible pour l’étudiant.
- Après ouverture de la liste des offres, avant toute saisie dans « Recherche », les quatre offres publiées sont affichées et le compteur indique « 4 offres ».

### Actions

1. Suivre le parcours de connexion décrit dans le contexte commun ; vérifier que la liste initiale affiche « 4 offres ».
2. Dans « Recherche », saisir `api rest` en minuscules.

### Résultat observable attendu

- Seule l’offre « API REST de facturation » (Orbis) est affichée.
- Les trois autres offres publiées ne sont pas affichées.
- Le compteur indique « 1 offre ».

## Scénario 2 — Recherche d’une offre non publiée

### État initial

- Compte à utiliser : étudiant **Lucas Dupont** (id étudiant 1).
- Avant la recherche, cet étudiant voit les quatre offres publiées : « Application React de gestion de flotte » (Lumen Digital), « API REST de facturation » (Orbis), « Tableau de bord de qualité des données » (Lumen Data) et « Assistant conversationnel interne » (Nexalis).
- « Refonte du portail client » — Lumen Digital, Soumise et invisible pour l’étudiant. Aucune des quatre offres publiées ne contient « portail » dans son titre.
- Après ouverture de la liste des offres, avant toute saisie dans « Recherche », seules les quatre offres publiées sont affichées.

### Actions

1. Suivre le parcours de connexion décrit dans le contexte commun ; vérifier que seules les quatre offres publiées sont affichées.
2. Dans « Recherche », saisir `portail`.

### Résultat observable attendu

- Aucune offre n’est affichée.
- « Refonte du portail client » n’apparaît pas.
- Le message affiché est exactement : « Aucune offre ne correspond à votre recherche. »
