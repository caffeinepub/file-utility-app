# Specification

## Summary
**Goal:** Add a stub POST `/webhook/urpay` route to the backend that returns 200 OK, with no business logic or payload processing.

**Planned changes:**
- Add an `http_request_update` handler in `backend/main.mo` that matches POST requests to `/webhook/urpay` and returns HTTP 200 with an empty body

**User-visible outcome:** A POST request to `/webhook/urpay` on the canister returns a 200 OK response, allowing the urpay connection to be verified as reachable.
