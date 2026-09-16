# Design Notes

## Architecture

The service exposes a single internal API and routes each order request through a courier registry. The registry resolves the correct adapter by the `courier_partner` name. This allows the platform to stay courier-agnostic while supporting new integrations via isolated adapter modules.

## Flow

1. Validate request payloads with Zod.
2. Check idempotency via internal `order_id` before any outbound courier call.
3. Resolve the appropriate adapter from the registry.
4. Persist normalized order data to the repository layer.
5. Capture tracking history as append-only events.
6. Return the normalized response contract to the caller.

## Bulk processing

The bulk endpoint uses concurrent promise execution with `Promise.allSettled` so each order is isolated. Failures are returned per order without aborting the rest of the batch.

## Security

- All secrets and transport settings are read from environment variables.
- Sensitive tokens remain in memory only.
- Raw external courier errors are mapped to internal AppError codes before returning to callers.
