# 🌱 Seed SaaS - Résumé

**Date:** Décembre 2024  
**Statut:** ✅ COMPLÉTÉ

---

## 📦 Données créées

### Plans d'abonnement

1. **Starter** (500 MAD/mois)
   - Modules: VEHICLES, BOOKINGS
   - Quotas: 2 agences, 10 utilisateurs, 20 véhicules

2. **Pro** (1000 MAD/mois)
   - Modules: VEHICLES, BOOKINGS, INVOICES, MAINTENANCE
   - Quotas: 10 agences, 50 utilisateurs, 100 véhicules

3. **Enterprise** (2000 MAD/mois)
   - Modules: Tous (VEHICLES, BOOKINGS, INVOICES, MAINTENANCE, FINES, ANALYTICS)
   - Quotas: Illimité (-1)

---

### Dépendances entre modules

- `BOOKINGS` → nécessite `VEHICLES`
- `INVOICES` → nécessite `BOOKINGS`
- `MAINTENANCE` → nécessite `VEHICLES`
- `FINES` → nécessite `BOOKINGS`
- `ANALYTICS` → nécessite `BOOKINGS` et `VEHICLES`

---

### Abonnements créés

1. **AutoLocation Premium** (Company 1)
   - Plan: **Pro**
   - Modules activés: VEHICLES, BOOKINGS, INVOICES, MAINTENANCE
   - Statut: ACTIVE

2. **CarRent Express** (Company 2)
   - Plan: **Starter**
   - Modules activés: VEHICLES, BOOKINGS
   - Statut: ACTIVE

---

### Préférences de notification

- **Company 1**: Email + In-App activés
- **Company 2**: Email activé, In-App désactivé

---

### Valeurs par défaut SaaS

- **Companies**: `status = ACTIVE`, `currency = MAD`
- **Agencies**: `status = ACTIVE`, `timezone = Africa/Casablanca`
- **UserAgencies**: `permission = FULL`

---

## 🧪 Comptes de test

```
SUPER_ADMIN: admin@malocauto.com / admin123

COMPANY_ADMIN 1: admin@autolocation.fr / admin123 (Plan Pro)
AGENCY_MANAGER 1: manager1@autolocation.fr / manager123
AGENT 1: agent1@autolocation.fr / agent123

COMPANY_ADMIN 2: admin@carrent.fr / admin123 (Plan Starter)
AGENCY_MANAGER 2: manager@carrent.fr / manager123
```

---

## 🚀 Utilisation

Pour réinitialiser et seed la base de données :

```bash
cd backend
npm run prisma:seed
```

Ou via Prisma directement :

```bash
npx prisma db seed
```

---

## ✅ Vérification

Après le seed, vous pouvez vérifier :

1. **Plans créés** : 3 plans (Starter, Pro, Enterprise)
2. **Modules configurés** : 6 modules avec dépendances
3. **Abonnements actifs** : 2 abonnements (Company 1 = Pro, Company 2 = Starter)
4. **CompanyModules activés** : Selon les plans
5. **Quotas définis** : Pour chaque plan

---

**✅ Seed SaaS complété avec succès !**


