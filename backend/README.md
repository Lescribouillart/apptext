# Backend — TextPlayStore

## Objectif

Le backend fournit l’API qui alimente les recommandations de texte et la détection du type de contenu. Son rôle est de centraliser les règles de suggestion littéraire et de proposer un service exploitable par le frontend.

## Stack technique

- Node.js
- HTTP natif sans framework
- JavaScript ES modules / CommonJS

## Structure du dossier

- server.js : point d’entrée du serveur HTTP
- suggestions.js : moteur de génération de suggestions et de détection d’intention
- package.json : dépendances et scripts de démarrage
- node_modules/ : dépendances installées localement
- .gitignore : fichiers à ignorer dans Git

## Endpoints exposés

- GET /api/health : vérification du service
- GET /api/suggestions : suggestions complètes pour un texte donné
- GET /api/text-type : analyse du type de texte détecté
- GET /api/local-suggestions : suggestions locales simplifiées

## Démarrage

Depuis ce dossier :

- node server.js

Le serveur écoute par défaut sur le port 3001.

## Rôle dans l’architecture globale

Le backend est le moteur de logique métier. Il ne s’occupe ni de l’interface graphique ni du rendu HTML. Il sert uniquement la logique suivante :

- classifier le texte
- déterminer le style ou le genre
- proposer des continuations cohérentes
- exposer ces résultats via une API HTTP

## Bonnes pratiques applicables

- garder le code métier dans les fichiers de logique
- limiter le serveur à la gestion des routes et des réponses HTTP
- centraliser les règles de suggestion dans le fichier de moteur
- documenter les routes et leur utilité
