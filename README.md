# TextPlayStore

## Présentation

Note est une application web de prise de notes et d’édition de texte orientée écriture créative et productivité. Elle permet à l’utilisateur d’écrire, formater son texte, exporter/importer des documents et recevoir des suggestions littéraires en temps réel.

## Architecture globale

Le projet est séparé en deux blocs fonctionnels :

- frontend/ : interface utilisateur, éditeur, styles et expérience visuelle
- backend/ : API de suggestions et logique métier textuelle

## Objectif fonctionnel

Le projet vise à fournir :

- un éditeur de texte ergonomique
- une mise en forme riche
- une persistance locale des documents
- un assistant d’écriture inspiré de l’analyse littéraire
- des suggestions contextualisées selon le texte saisi

## Périmètre technique

### Frontend

Le frontend est une application HTML/CSS/JS statique qui gère :

- l’UI de l’éditeur
- le contenu éditable
- les boutons d’outils
- l’import/export
- la sauvegarde locale
- l’affichage des suggestions dans le flux d’écriture

### Backend

Le backend est une API Node.js qui gère :

- la détection du type de texte
- la génération de suggestions cohérentes
- l’analyse de contexte littéraire
- les réponses HTTP pour consommation client

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
│   ├── suggestions.js
│   └── node_modules/
├── frontend/
│   ├── README.md
│   ├── index.html
│   ├── style.css
│   ├── publication.js
│   ├── suggestions.js
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

Le projet est conçu comme un outil d’écriture assistée, avec une couche UI web de qualité et un moteur de suggestions backend structuré pour évoluer sans brouiller l’interface.
