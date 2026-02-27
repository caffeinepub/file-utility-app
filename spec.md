# Specification

## Summary
**Goal:** Lock admin access in the backend to a single hardcoded Principal ID and restore the access-denied UI for unauthorized users visiting `/admin`.

**Planned changes:**
- Hardcode the Principal `s4myo-xkgcs-g3v6k-ebulj-irmjb-jkgr6-5mytx-gcqbz-a3qgn-fy7zr-yae` as a constant in `backend/main.mo`
- Update `getPendingVerifications()` and `approveUTR()` to reject any caller that does not match the hardcoded admin principal with `#err("Access denied. Admin only.")`
- Remove any dynamic admin-registration logic (e.g., `initAdmin()`) from the backend actor
- Restore the access-denied guard in `AdminPanel.tsx` so non-admin users see "Access denied. Admin only." instead of the verifications list
- Ensure the `/admin` route does not appear in the main tab navigation bar

**User-visible outcome:** Only the hardcoded admin principal can access pending verifications and approve UTRs; all other users visiting `/admin` see an "Access denied. Admin only." message.
