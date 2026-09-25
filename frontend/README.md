# Frontend — TextPlayStore

## Objectif

Le frontend est l’interface utilisateur de l’application de prise de notes et d’édition de texte. Il fournit :

- un éditeur de texte enrichi
- un titre d’article
- une barre d’outils de mise en forme
- l’import/export de documents
- la gestion locale des données via IndexedDB
- le moteur de suggestions littéraires en interface directe

## Stack technique

- HTML5
- CSS3
- JavaScript natif
- IndexedDB pour la persistance locale
- CDN externes pour les fonctionnalités d’import/export de document

## Structure du dossier

- index.html : point d’entrée de l’interface utilisateur
- style.css : styles globaux et mise en page
- publication.js : logique de l’éditeur, sauvegarde, import/export, suggestions
- suggestions.js : moteur de suggestions locales (version front)
- musique.js : gestion audio/lecteur si applicable
- assets/ : icônes et ressources visuelles
- scripts/ : scripts utilitaires de build / packaging

## Mode de développement

L’application est servie comme une application web statique.

Exemple de lancement local :

- depuis ce dossier : py -m http.server 3000
- puis ouvrir : http://localhost:3000

## Points d’attention

- Les éléments de l’éditeur sont gérés en JavaScript DOM.
- Les données sont stockées localement dans le navigateur.
- Les suggestions sont affichées dans le flux du document, et non dans une bulle flottante.
- L’interface est prévue pour fonctionner sans framework ni bundler.

## Rôle dans l’architecture globale

Le frontend est responsable de :

- l’expérience utilisateur
- l’interaction avec l’éditeur
- la présentation visuelle
- l’appel au backend pour les suggestions avancées si nécessaire

Le backend, lui, est responsable de la logique métier et des algorithmes de suggestion.
