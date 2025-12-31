Message à donner à Codex (version “factorisation”, clair et actionnable)

Copie-colle ceci :

Ne duplique pas le code en entier. Factorise.
Je veux que “Schéma tactique” et “Entraînement” utilisent le même moteur UI+logique, avec seulement une config différente.

Objectif

Créer une fonction unique, ex : renderBoardTab(config) (ou classe BoardApp) qui gère :

UI complète (export, affichage joueurs, annotations, commentaires, barre commandes, terrain, liste joueurs)

logique joueurs/flèches/séquences/lecture/export identique

Configs attendues

Schéma tactique

id: "tactique"

terrainUrl: assets/terrain-stade.png (ou l’actuel)

labels: { session: "Simulation", newSession: "Nouvelle simulation", sessionComment: "Commentaire de la simulation" }

enableMateriel: false

Entraînement

id: "entrainement"

terrainUrl: assets/entrainement/terrain entrainement.jpg

labels: { session: "Séance", newSession: "Nouvelle séance", sessionComment: "Commentaire de la séance" }

enableMateriel: true

materielBasePath: assets/entrainement/

Rendu UI

Les deux onglets doivent être strictement identiques en ordre + composants, sauf que :

Entraînement affiche le terrain d’entraînement

“Simulation” devient “Séance”

Entraînement ajoute un bloc “Ajout matériel” juste au-dessus de la barre commandes (Déplacer/Flèches…)

Matériel

Le bloc matériel doit :

charger les vignettes depuis assets/entrainement/

permettre ajout sur le terrain + drag

permettre changer la taille (scale slider)

être repliable/réductible

Important

Les images joueurs restent dans le dossier assets principal (ne pas dupliquer).
