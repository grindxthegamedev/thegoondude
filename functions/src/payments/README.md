# Payment Processing

Payment integration for site submissions.

## Files

| File | Purpose |
|------|---------|
| `endpoints.ts` | HTTP endpoints for payment flow |
| `payblis.ts` | Payblis payment gateway client |
| `index.ts` | Barrel exports |

## Payment Flow

1. User submits site at `/submit`
2. Frontend calls `/api/payments/checkout`
3. Payblis creates payment session
4. User completes payment
5. Webhook updates submission status
6. AI pipeline triggers on payment success

## Fee Structure

- **Standard Submission**: $20

## Security

- Webhook signature verification
- Server-side payment validation
- Firestore transaction-safe updates
