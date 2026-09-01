# Open Questions — deferred items ledger

Phase 4 exit criterion 7 (spec §12): known deferred items are recorded, not
hidden. Each item below awaits a decision gate before it becomes a feature.
None is silently invented behavior (spec F-009, plan constraint 3).

## Live tracking

What: real-time position/ETA for home-care or ambulance visits.
Gate: operator defines whether positions are ever exposed to patients.
Hook: none — the booking kernel has no tracking state.

## Insurance handling

What: insurance eligibility, claim codes, or insurer billing on bookings.
Gate: insurer partnership or an agreed claim flow (business decision).
Hook: none.

## Calendar integrations

What: two-way sync between appointments and external calendars.
Gate: a named calendar provider (e.g. Google/Outlook) is chosen.
Hook: none.

## Refunds

What: refunds of `paid_online` appointments back to the payer.
Gate: a refund policy plus a gateway refund API (spec §12; §13 risk 7).
Hook: `appointment.payment_status` already supports `refunded` (schema).

## No-show policy enforcement

What: marking appointments no-show and enforcing a policy consequence.
Gate: a booking no-show/cancellation policy decision (spec §13 risk 7).
Hook: none.

## Emergency dispatch

What: real-time emergency dispatch of ambulances.
Gate: operator defines a dispatch model (spec §11, §14). The ambulance service
ships as scheduled, non-emergency transport (Task 4.3 decision gate).
Hook: `dispatch_record` table and `service.dispatch_model` column hold the
schema hook for a future dispatch model.
