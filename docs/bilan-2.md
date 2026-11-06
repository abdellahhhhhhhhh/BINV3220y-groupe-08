# Bilan du projet Gesta – EF-32 et EF-33

### 1. Choix effectués lors de la planification
Le travail a été organisé en trois étapes : permettre à un étudiant de postuler à une offre, consulter ses candidatures et retirer une candidature. Nous avons choisi de réutiliser la table `applications` et les fonctionnalités déjà présentes, sans ajouter de dépendances. Les candidatures actives en double sont bloquées, tandis que les candidatures retirées sont conservées pour garder un historique.

### 2. Résultats obtenus
Les fonctionnalités EF-32 et EF-33 ont été développées :
- Un étudiant peut postuler à une offre publiée avec un message facultatif.
- Il peut consulter ses candidatures et leur statut.
- Il peut retirer une candidature encore en cours.
- L'interface indique lorsqu'il a déjà postulé à une offre.

Les contrôles de rôle, de propriété et de statut sont également vérifiés côté serveur.

### 3. Modifications apportées
Les modifications concernent principalement :
- Le backend : modèles, routes, contrôleurs, services et repositories pour gérer les candidatures.
- La base de données : ajout d'une migration pour empêcher les candidatures actives en double.
- Le frontend : formulaire de candidature, affichage des candidatures et possibilité de les retirer.
- La documentation et les fichiers de requêtes HTTP.
- Les tests backend et frontend associés.

### 4. Validation fonctionnelle
Les tests couvrent notamment la création d'une candidature, le blocage des doublons, l'affichage des candidatures et leur retrait. Plusieurs cas d'erreur sont également vérifiés : offre non publiée, mauvais rôle, candidature appartenant à un autre étudiant ou candidature déjà traitée.

Aucun test manuel dans le navigateur n'est documenté dans le suivi fourni.

### 5. Qualité du code
Des erreurs détectées pendant les vérifications ont été corrigées, notamment des imports inutilisés et des problèmes dans certaines assertions de tests. Aucun nouveau package n'a été ajouté et le fichier `package-lock.json` est resté inchangé.

### 6. Tests et commandes exécutées
La commande `npm run check` a été exécutée avec succès. Elle vérifie notamment le lint, le typage, les tests et la compilation.

Résultats finaux :
- **132 tests backend réussis**
- **59 tests frontend réussis**
- Lint et vérifications TypeScript réussis
- Build réussi

Les tests vérifient principalement la création, la consultation et le retrait des candidatures, ainsi que les différents cas d'erreur.