# Technical Specifications for UX Improvements

**Project:** MalocAuto Frontend  
**Date:** March 2026  
**Status:** Pending Validation

---

## Overview

Based on comparative analysis with LocaSign and current MalocAuto state, the following UX improvements have been identified.

| Improvement | Priority | Effort | Impact | API Status |
|-------------|----------|--------|--------|------------|
| 1. Enhanced Dashboard KPIs | HIGH | Medium (3-4h) | Major UX improvement | Partial - needs booking filter |
| 2. WhatsApp in Web | MEDIUM | Low (30min) | Quick win | N/A - client-side only |
| 3. Skeleton Loaders | MEDIUM | Medium (1-2h) | Better perceived performance | N/A - client-side only |
| 4. Notifications Dropdown | MEDIUM | Medium (1-2h) | Makes header functional | EXISTS - verified |

**Total Estimated Effort:** 6-9 hours (with margin for testing/QA)

---

## 1. Enhanced Dashboard with KPIs

### Current State
- Dashboard shows 4 basic StatCards: vehicles available, vehicles rented, clients count, active bookings
- No revenue, occupation rate, or trend data
- KPI data exists in `/agency/kpi` page but not on main dashboard

### Proposed Changes

**Files to Modify:**
| Component | File | Changes |
|-----------|------|---------|
| `AgencyDashboard` | `app/agency/page.tsx` | Add KPI data fetching, new stat cards, today widgets |

### New Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: "Tableau de bord" + Date range selector (optional) │
├─────────────────────────────────────────────────────────────┤
│  ROW 1: KPI Stats (6 cards in grid)                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  │Revenue │ │Occup.% │ │Vehic.  │ │Clients │ │Bookings│ │Margin  │
│  │du mois │ │taux    │ │dispo   │ │total   │ │actives │ │%       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
├─────────────────────────────────────────────────────────────┤
│  ROW 2: Quick Actions (unchanged)                           │
├─────────────────────────────────────────────────────────────┤
│  ROW 3: Two columns                                         │
│  ┌─────────────────────────┐ ┌─────────────────────────────┐│
│  │ Retours aujourd'hui     │ │ Departs aujourd'hui         ││
│  │ - Booking 1 (client)    │ │ - Booking 3 (client)        ││
│  │ - Booking 2 (client)    │ │ - Booking 4 (client)        ││
│  └─────────────────────────┘ └─────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  ROW 4: Recent Vehicles (unchanged)                         │
└─────────────────────────────────────────────────────────────┘
```

### API Calls Required (Verified)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /charges/kpi?startDate=X&endDate=Y` | EXISTS | Returns revenue, charges, margin, marginRate, occupancyRate, etc. (used in KPI page) |
| `GET /charges/kpi/vehicles?startDate=X&endDate=Y` | EXISTS | Returns per-vehicle profitability |
| `GET /analytics/agency/:agencyId/kpis?startDate=X&endDate=Y` | EXISTS | Alternative KPI endpoint (requires ANALYTICS module) |
| `GET /bookings` | EXISTS | Supports filters via query params, but **no `returnDate=today` filter** |

**API Gap Identified:**
The booking API currently does not have a `returnDate` or `startDate` filter for "today's returns/departures".

**Options:**
1. Add filters to backend `GET /bookings` endpoint (recommended)
2. Fetch all active bookings and filter client-side (not recommended for performance)
3. Create new endpoint `GET /bookings/today-summary` (cleanest solution)

### New Types

```typescript
interface DashboardKPI {
  revenue: number;
  charges: number;
  margin: number;
  marginRate: number;
  occupationRate: number;
  todayReturns: Booking[];
  todayDepartures: Booking[];
}
```

### Implementation Details

```typescript
// In app/agency/page.tsx

// Add new query for KPI data
const { data: kpiData, isLoading: kpiLoading } = useQuery({
  queryKey: ['agency-kpi', agencyId],
  queryFn: () => kpiApi.getAgencyKPI(agencyId),
  enabled: !!agencyId,
});

// Add query for today's returns
const today = new Date().toISOString().split('T')[0];
const { data: todayReturns } = useQuery({
  queryKey: ['bookings-returns-today', agencyId],
  queryFn: () => bookingApi.getAll({ returnDate: today, agencyId }),
  enabled: !!agencyId,
});

// Add query for today's departures
const { data: todayDepartures } = useQuery({
  queryKey: ['bookings-departures-today', agencyId],
  queryFn: () => bookingApi.getAll({ startDate: today, agencyId }),
  enabled: !!agencyId,
});
```

### Acceptance Criteria
- [ ] Dashboard shows revenue du mois with MAD currency formatting
- [ ] Occupation rate displayed as percentage with colored indicator
- [ ] Margin rate shown with positive/negative color coding
- [ ] Today's returns widget shows max 5 items with "Voir plus" link
- [ ] Today's departures widget shows max 5 items with "Voir plus" link
- [ ] All new stats have skeleton loaders while loading

---

## 2. WhatsApp Contact in Web Frontend

### Current State
- Mobile app has WhatsApp link in `BookingDetailsScreen.tsx`
- Web frontend booking details has no WhatsApp button
- Backend has WhatsApp Business API service

### Proposed Changes

**Files to Modify:**
| Component | File | Changes |
|-----------|------|---------|
| `BookingDetails` | `app/agency/bookings/[id]/page.tsx` | Add WhatsApp button in client section |
| `ClientDetails` | `app/agency/clients/[id]/page.tsx` | Add WhatsApp button |

### Helper Function

```typescript
// lib/utils/whatsapp.ts
export const getWhatsAppUrl = (phone: string, message?: string): string => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Add Morocco country code if not present
  const fullPhone = cleanPhone.startsWith('212') 
    ? cleanPhone 
    : `212${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;
  
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${fullPhone}${encodedMessage}`;
};
```

### Button Component

```typescript
// In booking details page - client info section
<a
  href={getWhatsAppUrl(
    client.phone, 
    `Bonjour ${client.firstName}, concernant votre réservation du ${formatDate(booking.startDate)}...`
  )}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors text-sm font-medium"
>
  <MessageCircle className="h-4 w-4" />
  Contacter via WhatsApp
</a>
```

### Visual Design
- Green color scheme (emerald-500) to match WhatsApp branding
- Icon: `MessageCircle` from lucide-react
- Position: Next to client phone number or in action buttons row

### Acceptance Criteria
- [ ] WhatsApp button visible on booking detail page
- [ ] WhatsApp button visible on client detail page
- [ ] Clicking opens WhatsApp Web/App with pre-filled message
- [ ] Phone number properly formatted with Morocco country code (+212)
- [ ] Pre-filled message includes client name and booking date

---

## 3. Skeleton Loaders

### Current State
- `LoadingState` component shows spinner + "Chargement..." text
- No content-aware skeleton placeholders
- Pages feel "jumpy" when data loads

### Proposed Changes

**New Files to Create:**
| Component | File | Purpose |
|-----------|------|---------|
| `Skeleton` | `components/ui/skeleton.tsx` | Base animated skeleton element |

**Files to Modify:**
| Component | File | Changes |
|-----------|------|---------|
| `StatCard` | `components/ui/stat-card.tsx` | Add `StatCardSkeleton` export |
| `VehiclesPage` | `app/agency/vehicles/page.tsx` | Use `VehicleCardSkeleton` |
| `BookingsPage` | `app/agency/bookings/page.tsx` | Use `TableRowSkeleton` |
| `ClientsPage` | `app/agency/clients/page.tsx` | Use `TableRowSkeleton` |

### Base Skeleton Component

```typescript
// components/ui/skeleton.tsx
'use client';

import { cn } from '@/lib/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ 
  className, 
  variant = 'rectangular', 
  ...props 
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-surface-3',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-md',
        className
      )}
      {...props}
    />
  );
}

// Stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

// Vehicle card skeleton
export function VehicleCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface-1 overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24" />
        <div className="pt-3 border-t border-border flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

// Booking card skeleton
export function BookingCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}
```

### Usage Pattern

```typescript
// Before
{isLoading ? (
  <LoadingState message="Chargement..." />
) : (
  <VehicleGrid vehicles={vehicles} />
)}

// After
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <VehicleCardSkeleton key={i} />
    ))}
  </div>
) : (
  <VehicleGrid vehicles={vehicles} />
)}
```

### Animation CSS
Already exists in `tailwind.config.ts`:
```typescript
animation: {
  'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
}
```

### Acceptance Criteria
- [ ] Skeleton component created with text, circular, rectangular variants
- [ ] StatCardSkeleton matches StatCard dimensions
- [ ] VehicleCardSkeleton matches vehicle card layout
- [ ] TableRowSkeleton configurable for different column counts
- [ ] All skeletons use consistent animation timing
- [ ] At least 3 pages updated to use skeletons (vehicles, bookings, dashboard)

---

## 4. Notifications Dropdown Panel

### Current State
- Header has Bell icon with red dot indicator
- No dropdown panel, not clickable
- Notifications page exists at `/agency/notifications`
- Backend API exists for notifications

### Proposed Changes

**New Files to Create:**
| Component | File | Purpose |
|-----------|------|---------|
| `NotificationsDropdown` | `components/layout/notifications-dropdown.tsx` | Dropdown panel |

**Files to Modify:**
| Component | File | Changes |
|-----------|------|---------|
| `Header` | `components/layout/header.tsx` | Replace bell button with dropdown |

### Dropdown Visual Design

```
┌─────────────────────────────────────┐
│ Notifications           Tout lire  │
├─────────────────────────────────────┤
│ ● Retour vehicule AB-123-CD         │
│   Il y a 5 minutes                  │
├─────────────────────────────────────┤
│ ○ Nouveau client inscrit            │
│   Il y a 1 heure                    │
├─────────────────────────────────────┤
│ ○ Maintenance prevue - Clio         │
│   Il y a 2 heures                   │
├─────────────────────────────────────┤
│         Voir toutes →               │
└─────────────────────────────────────┘

Legend:
● = Unread (primary color dot)
○ = Read (subtle color dot)
```

### Component Implementation

```typescript
// components/layout/notifications-dropdown.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api/notification';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface Notification {
  id: string;
  type: 'BOOKING_RETURN' | 'BOOKING_START' | 'MAINTENANCE_DUE' | 'CLIENT_NEW' | 'FINE_ADDED';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch recent notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => notificationApi.getRecent(10),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    },
  });

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-subtle hover:text-foreground hover:bg-surface-2 transition-colors relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-surface-1 shadow-elevation-3 overflow-hidden animate-fade-in z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs text-primary hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-foreground-subtle">
                Aucune notification
              </div>
            ) : (
              notifications.map((notif: Notification) => (
                <div
                  key={notif.id}
                  className={cn(
                    'flex gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-2 transition-colors cursor-pointer',
                    !notif.read && 'bg-primary/5'
                  )}
                  onClick={() => {
                    if (!notif.read) {
                      markAsReadMutation.mutate(notif.id);
                    }
                  }}
                >
                  <div className={cn(
                    'mt-1.5 h-2 w-2 rounded-full flex-shrink-0',
                    notif.read ? 'bg-foreground-subtle' : 'bg-primary'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{notif.title}</p>
                    <p className="text-xs text-foreground-subtle mt-0.5">
                      {formatDistanceToNow(new Date(notif.createdAt), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <Link
            href="/agency/notifications"
            className="block px-4 py-3 text-center text-xs text-primary hover:bg-surface-2 border-t border-border transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  );
}
```

### API Requirements (Verified)

Backend controller: `backend/src/modules/in-app-notification/in-app-notification.controller.ts`

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `GET /notifications/in-app` | GET | EXISTS | Supports `?limit=X&unreadOnly=true` |
| `GET /notifications/in-app/unread-count` | GET | EXISTS | Returns `{ count: number }` |
| `PATCH /notifications/in-app/:id/read` | PATCH | EXISTS | Mark single as read |
| `POST /notifications/in-app/read-all` | POST | EXISTS | Mark all as read (note: POST not PATCH) |

**Frontend API file needed:** `lib/api/notification.ts` does not exist.

Create:
```typescript
// lib/api/notification.ts
import { apiClient } from './client';

export const inAppNotificationApi = {
  getRecent: async (limit = 10, unreadOnly = false) => {
    const res = await apiClient.get('/notifications/in-app', {
      params: { limit, unreadOnly }
    });
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await apiClient.get('/notifications/in-app/unread-count');
    return res.data.count;
  },
  markAsRead: async (id: string) => {
    const res = await apiClient.patch(`/notifications/in-app/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.post('/notifications/in-app/read-all');
    return res.data;
  },
};
```

### Acceptance Criteria
- [ ] Bell icon shows animated indicator when unread notifications exist
- [ ] Clicking bell opens dropdown panel
- [ ] Dropdown shows last 10 notifications
- [ ] Unread notifications have primary color dot and subtle background
- [ ] Clicking notification marks it as read
- [ ] "Tout marquer lu" button marks all as read
- [ ] "Voir toutes" link navigates to notifications page
- [ ] Clicking outside closes dropdown
- [ ] Dropdown auto-refreshes every 30 seconds
- [ ] Proper date formatting in French (il y a 5 minutes, etc.)

---

## Implementation Order

Recommended implementation sequence:

1. **Skeleton Loaders** (Foundation)
   - Create base skeleton component first
   - Other improvements will use it

2. **Enhanced Dashboard** (High Impact)
   - Most visible improvement
   - Shows business value immediately

3. **WhatsApp Integration** (Quick Win)
   - Simple to implement
   - Immediate utility

4. **Notifications Dropdown** (Polish)
   - Makes existing feature functional
   - Improves header completeness

---

## API Gaps Summary

| Feature | Missing API | Backend File | Proposed Solution |
|---------|-------------|--------------|-------------------|
| Dashboard Today Returns | `GET /bookings?endDate=today` filter | `booking.service.ts` | Add date filters to `findAll()` |
| Dashboard Today Departures | `GET /bookings?startDate=today` filter | `booking.service.ts` | Add date filters to `findAll()` |
| Notifications Frontend | `lib/api/notification.ts` | N/A | Create new frontend API file |

**Backend Changes Required:**
Add to `booking.service.ts` `findAll()` method:
```typescript
// In filters handling
if (filters.endDateFrom || filters.endDateTo) {
  where.endDate = {
    ...(filters.endDateFrom && { gte: new Date(filters.endDateFrom) }),
    ...(filters.endDateTo && { lte: new Date(filters.endDateTo) }),
  };
}
if (filters.startDateFrom || filters.startDateTo) {
  where.startDate = {
    ...(filters.startDateFrom && { gte: new Date(filters.startDateFrom) }),
    ...(filters.startDateTo && { lte: new Date(filters.startDateTo) }),
  };
}
```

---

## Validation Checklist

Before implementation, confirm:
- [ ] API endpoints exist or need to be created
- [ ] Design matches existing theme (dark/light)
- [ ] Mobile responsiveness requirements
- [ ] Accessibility requirements (keyboard nav, screen readers)
- [ ] Performance budget (bundle size impact)

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Owner | | | Pending |
| Tech Lead | | | Pending |
| Designer | | | Pending |
