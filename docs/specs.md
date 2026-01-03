MalocAuto — Documentation Fonctionnelle \& Technique (Master Spec)



Version : 1.0 — Stable

Auteur : Hamza KHAMLICHI

Destinée à : Développeurs Cursor



🧩 1. Vision du Produit



MalocAuto est un SaaS B2B destiné aux entreprises de location de voitures afin de gérer :



Leur flotte automobile



Leurs agences



Leurs utilisateurs



Leurs clients



Leurs contrats de location



Leurs amendes



Leur maintenance



Un planning professionnel des véhicules



Des rôles et permissions complexes (multi-tenant + multi-agences)



Le système est conçu pour permettre à une entreprise cliente d'avoir une ou plusieurs agences, chacune pouvant fonctionner indépendamment tout en partageant certaines ressources (utilisateurs, véhicules…).



🧱 2. Architecture générale

🔹 Architecture SaaS Multi-Tenant (Entreprise / Agences)



SUPER\_ADMIN (SaaS)



Gère les entreprises clientes (Companies)



Gère la facturation et les modules



Gère l’état des comptes (activé/désactivé)



COMPANY\_ADMIN



Admin d'une entreprise cliente



Peut créer/agencer ses agences



Peut créer des utilisateurs et leur attribuer des agences



AGENCY\_MANAGER



Gère une seule ou plusieurs agences



Gère les véhicules, locations, amendes, maintenance



Gère les agents de son agence



AGENT



Profil opérationnel



Peut créer des locations, gérer des clients



Accès limité



⚠️ Un utilisateur peut être rattaché à plusieurs agences.



🗄️ 3. Modèle de données (Prisma Schema attendu)

📌 Company



Une entreprise cliente du SaaS.



Company {

&nbsp; id

&nbsp; name

&nbsp; slug

&nbsp; phone?

&nbsp; address?

&nbsp; isActive (bool)

&nbsp; createdAt

&nbsp; updatedAt

&nbsp; agencies\[]

&nbsp; users\[]

}



📌 Agency



Une entreprise peut avoir plusieurs agences.



Agency {

&nbsp; id

&nbsp; name

&nbsp; companyId (FK Company)

&nbsp; phone?

&nbsp; address?

&nbsp; createdAt

&nbsp; updatedAt

&nbsp; vehicles\[]

&nbsp; bookings\[]

&nbsp; fines\[]

&nbsp; maintenance\[]

&nbsp; userAgencies\[]

}



📌 User



Un utilisateur du système.



User {

&nbsp; id

&nbsp; email

&nbsp; password

&nbsp; name

&nbsp; role

&nbsp; companyId? (FK Company)

&nbsp; isActive

&nbsp; createdAt

&nbsp; updatedAt

&nbsp; userAgencies\[]

}



📌 UserAgency (N-N)



Un utilisateur peut appartenir à 1 ou plusieurs agences.



UserAgency {

&nbsp; id

&nbsp; userId (FK User)

&nbsp; agencyId (FK Agency)

&nbsp; @@unique(\[userId, agencyId])

}



📌 Vehicle

Vehicle {

&nbsp; id

&nbsp; agencyId

&nbsp; registrationNumber

&nbsp; brand

&nbsp; model

&nbsp; year

&nbsp; mileage

&nbsp; fuel?

&nbsp; gearbox?

&nbsp; dailyRate

&nbsp; depositAmount

&nbsp; status

&nbsp; createdAt

&nbsp; updatedAt

&nbsp; bookings\[]

&nbsp; maintenance\[]

}



📌 Client

Client {

&nbsp; id

&nbsp; agencyId

&nbsp; name

&nbsp; email?

&nbsp; phone?

&nbsp; note?

&nbsp; bookings\[]

}



📌 Booking

Booking {

&nbsp; id

&nbsp; agencyId

&nbsp; vehicleId

&nbsp; clientId

&nbsp; startDate

&nbsp; endDate

&nbsp; totalPrice

&nbsp; status

&nbsp; createdAt

&nbsp; updatedAt

&nbsp; fines\[]

}



📌 Fine

Fine {

&nbsp; id

&nbsp; agencyId

&nbsp; bookingId

&nbsp; amount

&nbsp; description

&nbsp; createdAt

}



📌 Maintenance

Maintenance {

&nbsp; id

&nbsp; agencyId

&nbsp; vehicleId

&nbsp; description

&nbsp; plannedAt?

&nbsp; cost?

&nbsp; status

&nbsp; createdAt

}



📌 PasswordResetToken



Permet l’email de première connexion + mot de passe oublié.



🔐 4. Gestion des rôles \& permissions

Action	SUPER\_ADMIN	COMPANY\_ADMIN	AGENCY\_MANAGER	AGENT

Créer entreprise	✅	❌	❌	❌

Créer agence	❌	✅	❌	❌

Créer utilisateurs	❌	✅	⚠️ (dans ses agences)	❌

Gérer flotte	❌	⚠️ (si accès)	✅	❌

Gérer locations	❌	⚠️	✅	✅

Gérer amendes	❌	⚠️	✅	⚠️

Gérer maintenance	❌	⚠️	✅	❌

Accéder planning	❌	⚠️	✅	⚠️



⚠️ = accès partiel selon les agences associées



🧭 5. Fonctionnalités principales

🔹 Backoffice SaaS (SUPER\_ADMIN)



Liste des entreprises clientes



Activation/désactivation d’un client



Envoi automatique d’email lors de la création d’une entreprise



Gestion des modules (futures options premium)



Dashboard SaaS



🔹 Espace Entreprise (COMPANY\_ADMIN)



Création \& gestion des agences



Création des utilisateurs (manager / agent)



Attribution multi-agences



Gestion de la flotte globale



🔹 Espace Agence (Manager \& Agents)



Voir la flotte



Créer et gérer les contrats



Créer et gérer les clients



Enregistrer les amendes



Voir et créer des interventions maintenance



Visualiser le planning des véhicules



📆 6. Planning des véhicules



Utiliser : FullCalendar + Timeline View



Chaque ligne = un véhicule

Chaque événement = une location ou un blocage maintenance.



Statuts de couleur :



🟢 Disponible



🔵 Réservé (booking en cours)



🟠 Réservé (à venir)



🔴 En maintenance



⚫ Non disponible



Filtrage possible :



par agence



par marque / modèle



par statut véhicule



par période



par manager



🎨 7. Ligne directrice Design

Style général :



Moderne, sombre chic



Minimaliste (comme Stripe Dashboard)



Couleurs sobres :



\#1D1F23 (fond principal)



\#2C2F36 (cartes)



\#3E7BFA (primaire bleu électrique)



\#E5E7EB (texte secondaire)



Navigation :



Barre latérale fixe



Header avec informations utilisateur



Boutons arrondis



Icônes Lucide



Frontend Admin :



Formulaires simples, cartes uniformes, affichage clair multi-entreprises.



Frontend Agence :



Focalisé sur l’opérationnel, rapide et fluide.



🏗️ 8. Stack Technique Obligatoire

Backend



Node.js



Express



Prisma ORM



PostgreSQL



JWT Auth



Bcrypt hashing



Nodemailer (email création entreprise)



Frontend Admin / Agence



React + Vite



TailwindCSS



React Query



Axios



FullCalendar



🧪 9. Tests



Types prévus :



Tests API



Tests de permission



Tests d’intégration Prisma



🚀 10. Livrables attendus par Cursor



En suivant ce document, Cursor doit générer :



Backend complet



Prisma schema



Routes Express (auth, companies, agencies, users, vehicles, bookings, fines, maintenance)



Auth middleware



Email service



Seed script



Server app



Admin Frontend complet



Login Admin



Dashboard SaaS



Gestion des entreprises



Gestion des agences



Gestion des utilisateurs multi-agences



Planning global entreprise



Agence Frontend complet



Login



Dashboard agence



Gestion flotte



Gestion clients \& locations



Planning agence FullCalendar



📌 11. Roadmap MVP



Backend architecture + modèle de données



Auth + rôles + multi-agences



CRUD véhicules, locations, clients



Planning FullCalendar



Dashboard



Email création entreprise



Interfaces Admin \& Agence



✔️ FIN DU DOCUMENT



Ce document représente l’intégralité de la vision fonctionnelle et technique du projet MalocAuto.

Il doit être considéré comme la source officielle pour la génération du code dans Cursor.

