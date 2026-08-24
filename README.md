# Text - L'éditeur pour Android / Play Store

Ce projet contient désormais un wrapper Android Capacitor basé sur la PWA déjà présente dans le dossier [textancienprojet](textancienprojet).

## Structure

- [textancienprojet](textancienprojet) : application web existante
- [capacitor.config.json](capacitor.config.json) : configuration Capacitor
- [android](android) : projet Android généré

## Commandes utiles

Depuis la racine du projet :

```bash
npm install
npm run sync
npm run open:android
```

## Etapes pour publier sur le Play Store

1. Installer Java JDK 17
2. Installer Android Studio + Android SDK
3. Définir la variable JAVA_HOME
4. Ouvrir le dossier [android](android) dans Android Studio
5. Configurer le package et signer l’application
6. Générer un fichier AAB
7. Publier sur le Play Store

## Vérification actuelle

Le projet Android est bien créé, mais le build local ne peut pas démarrer tant que Java et Android SDK ne sont pas installés sur cette machine.

Erreur constatée :

```bash
./android/gradlew tasks --all
```

Retour :

```text
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

## Important

La PWA n’a pas été modifiée. Elle est simplement encapsulée dans un conteneur Android pour pouvoir être publiée comme application native Android.
