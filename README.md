# TextPlayStore

## Présentation

Note est une application web de prise de notes et d’édition de texte orientée écriture créative et productivité. Elle permet à l’utilisateur d’écrire, formater son texte, exporter/importer des documents et garder un environnement de travail stable et lisible.

## Architecture globale

Le projet est séparé en deux blocs fonctionnels :

- frontend/ : interface utilisateur, éditeur, styles et expérience visuelle
- backend/ : API de service local et logique métier minimale du projet

## Objectif fonctionnel

Le projet vise à fournir :

- un éditeur de texte ergonomique
- une mise en forme riche
- une persistance locale des documents
- un correcteur d’orthographe léger et lisible
- une navigation stable entre les écrans de l’application

## Périmètre technique

### Frontend

Le frontend est une application HTML/CSS/JS statique qui gère :

- l’UI de l’éditeur
- le contenu éditable
- les boutons d’outils
- l’import/export
- la sauvegarde locale
- l’interface de saisie et la mise en forme du texte

### Backend

Le backend est une API Node.js qui gère :

- le contrôle de service et la santé du serveur
- les réponses HTTP pour la couche client
- la logique minimale de support sans dépendre d’un moteur de suggestions

## Démarrage rapide

### Backend

```bash
cd backend
node server.js
```

### Frontend

```bash
cd frontend
py -m http.server 3000
```

Puis ouvrir : http://localhost:3000

## Structure du dépôt

```text
textplaystore/
├── README.md
├── backend/
│   ├── README.md
│   ├── .gitignore
│   ├── package.json
│   ├── server.js
│   └── node_modules/
├── frontend/
│   ├── README.md
│   ├── index.html
│   ├── style.css
│   ├── publication.js
│   ├── musique.js
│   ├── assets/
│   ├── scripts/
│   └── capacitor.config.json
└── .git/
```

## Rôle de chaque dossier

- [README.md](README.md) : vue d’ensemble du projet et des responsabilités globales
- [backend/README.md](backend/README.md) : documentation du service backend
- [frontend/README.md](frontend/README.md) : documentation de l’interface web

## Bonnes pratiques mises en place

- séparation nette entre interface et logique métier
- documentation par périmètre fonctionnel
- architecture lisible pour un développeur extérieur
- point d’entrée unique pour chaque couche
- conventions de service et de responsabilité explicites

## À retenir

Le projet est conçu comme un outil d’écriture et de mise en forme, avec une couche UI web stable et un serveur léger sans moteur de suggestions intégré.
