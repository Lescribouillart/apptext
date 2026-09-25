# Frontend — TextPlayStore

## Objectif

Le frontend est l’interface utilisateur de l’application de prise de notes et d’édition de texte. Il fournit :

- un éditeur de texte enrichi
- un titre d’article
- une barre d’outils de mise en forme
- l’import/export de documents
- la gestion locale des données via IndexedDB
- un correcteur de base sans moteur de suggestion de mots

## Stack technique

- HTML5
- CSS3
- JavaScript natif
- IndexedDB pour la persistance locale
- CDN externes pour les fonctionnalités d’import/export de document

## Structure du dossier

- index.html : point d’entrée de l’interface utilisateur
- style.css : styles globaux et mise en page
- publication.js : logique de l’éditeur, sauvegarde, import/export et correcteur de texte
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
- L’interface est prévue pour fonctionner sans framework ni bundler.
- Le correcteur ne propose plus de suggestions de mots dans le flux d’écriture.

## Rôle dans l’architecture globale

Le frontend est responsable de :

- l’expérience utilisateur
- l’interaction avec l’éditeur
- la présentation visuelle
- la gestion du correcteur de texte sans moteur de suggestions de mots

Le backend, lui, est responsable de la logique métier minimale et de la santé du service.
