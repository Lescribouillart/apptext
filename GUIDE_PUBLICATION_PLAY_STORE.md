# Guide de publication Android / Play Store

Ce document explique comment publier l’application actuelle sous forme d’application Android à partir de la PWA déjà présente dans le dossier `textancienprojet`.

## 1. Ce que tu as déjà

Tu as déjà :

- une application web dans le dossier `textancienprojet`
- un projet Android prêt dans le dossier `android`
- la configuration Capacitor dans le fichier `capacitor.config.json`

Le projet a été préparé pour être transformé en app Android sans remplacer la version web.

---

## 2. Prérequis à installer sur ton ordinateur

### 2.1 Installer Java 17

1. Va sur : https://adoptium.net/
2. Télécharge JDK 17
3. Installe-le
4. Vérifie dans PowerShell :

```powershell
java -version
javac -version
```

Si ça ne marche pas, ajoute la variable JAVA_HOME :

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

### 2.2 Installer Android Studio

1. Va sur : https://developer.android.com/studio
2. Télécharge Android Studio
3. Installe-le
4. Ouvre Android Studio
5. Dans le menu, ouvre SDK Manager
6. Installe au minimum :
   - Android SDK Platform 35
   - Android SDK Build-Tools 35
   - Android SDK Command-line Tools
   - Android SDK Platform-Tools

Vérifie :

```powershell
adb version
```

---

## 3. Ouvrir le projet Android

Dans Android Studio :

1. File > Open
2. Sélectionne le dossier `android`
3. Laisse Android Studio terminer la synchronisation
4. Accepte les composants manquants si Android Studio te le propose

Si tout est bien installé, le projet doit s’ouvrir sans erreur.

---

## 4. Vérifier que le projet compile

Dans Android Studio :

1. Clique sur Build
2. Choisis Make Project
3. Ou Build > Build Bundle(s) / APK(s)

Tu dois obtenir une compilation sans erreur.

Si tu as une erreur :

- Java n’est pas reconnu
- Android SDK n’est pas installé
- des composants manquent

Il faut alors relire le message d’erreur et corriger la cause exacte.

---

## 5. Créer la signature de l’application

Pour publier sur le Play Store, il faut signer ton application avec un keystore.

Ouvre PowerShell et lance :

```powershell
cd "C:\Users\jacq\Documents\Bureau-v9\2. Projet - dev\textplaystore"
keytool -genkeypair -v -keystore text-release.keystore -alias text-release -keyalg RSA -keysize 2048 -validity 10000
```

Tu devras renseigner plusieurs informations :

- mot de passe
- nom complet
- organisation
- ville
- pays

### Important

Ce fichier `text-release.keystore` doit être conservé en sécurité. Sans lui, tu ne pourras plus mettre à jour ton application sur le Play Store.

---

## 6. Générer le fichier AAB pour le Play Store

Dans Android Studio :

1. Build > Generate Signed Bundle / APK
2. Choisis `Android App Bundle`
3. Suis l’assistant
4. Sélectionne le keystore `text-release.keystore`
5. Saisis le mot de passe
6. Clique sur Finish

Le fichier généré est un `.aab`.

C’est ce fichier qu’on upload dans le Play Store.

---

## 7. Créer le compte Play Console

1. Va sur : https://play.google.com/console
2. Crée un compte développeur Google
3. Paye la cotisation demandée par Google
4. Connecte-toi

---

## 8. Créer une application dans Play Console

1. Clique sur `Create app`
2. Choisis :
   - App
   - Pays : France
3. Remplis le nom de l’application
4. Valide la création

### Nom conseillé

`Text - L'éditeur`

### Identifiant du package

`fr.texteditor.app`

Il correspond déjà au package Android configuré dans le projet.

---

## 9. Remplir la fiche Play Store

Tu dois compléter :

- nom de l’application
- description courte
- description complète
- catégorie
- niveau de contenu
- icône
- captures d’écran
- politique de confidentialité si nécessaire

### Description courte

Exemple :

> Éditeur d’articles et notes en local.

### Description longue

Exemple :

> Text - L’éditeur est une application simple et rapide pour écrire, organiser et enregistrer des textes, brouillons et idées. Idéale pour la prise de notes, la rédaction d’articles ou la création de contenus personnels dans un environnement léger et sans complication.

---

## 10. Préparer les ressources visuelles

### Icône
Utilise l’icône actuelle du projet :

`textancienprojet/assets/icons/text.png`

Elle est déjà un bon point de départ, mais il faut une version propre pour le Play Store :

- 512x512
- format PNG
- fond simple
- bien lisible en petit

### Captures d’écran
Tu auras besoin de quelques captures de l’application Android :

- écran d’accueil
- écran d’édition
- écran de sauvegarde / création d’article

Tu peux faire des captures à partir d’un émulateur Android dans Android Studio.

---

## 11. Uploader le bundle AAB

Dans Play Console :

1. Va dans la section `Test and release`
2. Clique sur `Production`
3. `Create new release`
4. Charge le fichier `.aab`
5. Complète les champs demandés
6. Enregistre
7. Soumet pour revue

Google va vérifier le fichier. Cela peut prendre plusieurs heures ou quelques jours.

---

## 12. Checklist avant publication

Avant d’envoyer ta version, vérifie ceci :

- [ ] Java 17 installé
- [ ] Android Studio installé
- [ ] SDK Android installé
- [ ] le projet ouvre dans Android Studio
- [ ] l’application compile
- [ ] le keystore a été créé
- [ ] le fichier AAB a été généré
- [ ] le nom de l’application est correct
- [ ] la description est claire
- [ ] les captures d’écran sont ajoutées
- [ ] l’icône est prête
- [ ] le bundle est uploadé dans Play Console

---

## 13. Petit conseil pour ton premier projet

Fais les choses dans l’ordre, sans aller trop vite :

1. installer Java
2. installer Android Studio
3. ouvrir le projet
4. compiler
5. signer
6. générer le AAB
7. créer la fiche Play Store
8. uploader
9. attendre validation

---

## 14. Résumé très court

Tu es déjà bien avancé : ton projet est prêt en Android. Il manque uniquement l’environnement de build sur ton ordinateur pour générer le bundle final et le publier sur le Play Store.

La suite est donc :

- installer Java 17
- installer Android Studio
- ouvrir le dossier `android`
- générer le `.aab`
- publier dans Play Console

---

## 15. Ce qu’il faut garder en mémoire

- le dossier `textancienprojet` est toujours nécessaire, car c’est la source de l’application web qui est intégrée dans Android
- le dossier `android` est le wrapper Android utilisé pour construire l’application
- le fichier `capacitor.config.json` contient le nom et l’ID de l’application
- le package actuel est `fr.texteditor.app`

---

## 16. À partir de là

Quand tu auras installé Java et Android Studio, je peux ensuite te guider pour :

- ouvrir le projet dans Android Studio
- générer le keystore
- générer le AAB
- vérifier les erreurs de build
- préparer la publication sur Play Console

Tu peux aussi me dire si tu veux que je te fasse directement une version encore plus simple, avec des captures d’écran de chaque étape à faire dans Android Studio.
