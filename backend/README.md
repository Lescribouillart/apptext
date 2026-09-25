# Backend — TextPlayStore

## Objectif

Le backend fournit l’API de service de base pour l’application. Son rôle est de garantir un service stable et exploitable par le frontend sans dépendre d’un moteur de suggestions de mots ou de phrases.

## Stack technique

- Node.js
- HTTP natif sans framework
- JavaScript ES modules / CommonJS

## Structure du dossier

- server.js : point d’entrée du serveur HTTP
- package.json : dépendances et scripts de démarrage
- node_modules/ : dépendances installées localement
- .gitignore : fichiers à ignorer dans Git

## Endpoints exposés

- GET /api/health : vérification du service

## Démarrage

Depuis ce dossier :

- node server.js

Le serveur écoute par défaut sur le port 3001.

## Rôle dans l’architecture globale

Le backend est le moteur de logique métier minimal. Il ne s’occupe ni de l’interface graphique ni du rendu HTML. Il sert uniquement à :

- vérifier la santé du service
- exposer des endpoints de base via une API HTTP
- rester indépendant de toute fonction de suggestion de mots

## Bonnes pratiques applicables

- garder le code métier dans les fichiers de logique
- limiter le serveur à la gestion des routes et des réponses HTTP
- éviter toute dépendance à un moteur de suggestions de mots
- documenter les routes et leur utilité
