# Specification

## Summary
**Goal:** Remove all admin access restrictions so any authenticated user can access the admin panel and its functionality.

**Planned changes:**
- Remove principal-based access control from `getPendingVerifications()` and `approveUTR()` in the backend, making them callable by any authenticated user
- Remove or disable the admin principal storage logic in `initAdmin()` so it no longer gates access
- Remove stored admin principal state and all access-denied guard clauses from the two affected backend methods
- Remove the `initAdmin()` call on mount from `AdminPanel.tsx`
- Remove the "Access denied. Admin only." error display logic from `AdminPanel.tsx`
- Make `AdminPanel.tsx` immediately fetch and display pending UTR verifications on mount without any access check

**User-visible outcome:** Any authenticated user can navigate to the admin panel, view pending UTR verifications, and approve them without encountering any access-denied errors.
