# Matrice 2 — Traçabilité des cas de test par rapport aux exigences (EF-32, EF-33)

Projet Gesta (BINV3220y, groupe 08). Constats établis en novembre 2026 sur la branche `semaine-3`, créée à partir de `main` au commit `dc38690`.

Légende de la colonne « Statut » : **exécuté** = lancé pendant la séance avec une sortie observée ; **lu** = fichier ouvert et lu, mais rien d'exécuté ; **non vérifié** = non ouvert ou non lancé.

---

## 1. Couverture des exigences

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

## 2. Modifications et vérification

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
- Un test vert prouve que le comportement testé est conforme, pas que la couverture est complète. La partie 1 est établie par lecture des tests et du code, sans outil de couverture.
