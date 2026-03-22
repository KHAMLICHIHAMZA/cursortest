# UAT Checklist - Functional Cycles (2026-03-07)

## Scope

- Booking lifecycle (create, edit, check-in, check-out, financial closure).
- Charges & expenses (scope/cost center/category, recurrence, CSV export).
- Role-based access (AGENT, AGENCY_MANAGER, COMPANY_ADMIN, SUPER_ADMIN).
- Profile completion and activation flows.
- Mobile check-in/check-out capture integrity.

## Environment

- Backend and frontend-web running on latest local branch.
- Prisma schema regenerated and backend restarted.
- At least one company with one agency, manager, agent, clients, and vehicles.
- Test datasets seeded using scripts when needed.

## Checklist

- [ ] AGENT cannot create a booking (expect `403`).
- [ ] AGENT cannot update a booking (expect `403`).
- [ ] AGENT cannot delete a booking (expect `403`).
- [ ] AGENT can perform check-in on assigned booking.
- [ ] AGENT can perform check-out on assigned booking.
- [ ] AGENCY_MANAGER can run financial closure.
- [ ] AGENT cannot run financial closure (expect `403`).
- [ ] On check-out, pending financial closure notification is created for agency managers.
- [ ] Repeating check-out action does not duplicate the same pending closure notification.
- [ ] New AGENT receives activation/setup email at creation.
- [ ] New AGENCY_MANAGER receives activation/setup email at creation.
- [ ] First login profile completion lock is enforced for AGENT when profile is incomplete.
- [ ] First login profile completion lock is enforced for AGENCY_MANAGER when profile is incomplete.
- [ ] SUPER_ADMIN is not blocked by profile completion lock.
- [ ] Charges form shows only categories allowed by selected scope/cost center.
- [ ] Charges list filters categories according to selected scope/cost center.
- [ ] Recurrence selector supports `NONE`, `MONTHLY`, `QUARTERLY`, `YEARLY`.
- [ ] CSV export respects active filters and opens correctly in Excel (UTF-8 BOM + CRLF).
- [ ] KPI page displays shared-charge allocation in vehicle profitability.
- [ ] KPI page displays charges by cost center.
- [ ] Mobile signature pad loads on device (no WebView unsupported message).
- [ ] Mobile checkout displays hydrated start data (odometer/fuel/notes) from check-in payload.

## Evidence to Attach

- API response screenshots for key `403` and success paths.
- UI screenshots for charges filtering and recurrence options.
- Notification list screenshots (single reminder, no duplicate).
- Mobile screenshots for signature and checkout start values.
- CSV sample exported file and opening proof in Excel.

## Exit Criteria

- All mandatory checks pass.
- No blocker or critical regression remains open.
- Any minor deviations are documented with workaround and owner.
