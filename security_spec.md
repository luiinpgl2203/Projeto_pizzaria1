# Security Specification - Pizzaria Funchal

## Data Invariants
1. A user can only access data belonging to the `pizzeriaId` associated with their profile.
2. Orders cannot be modified once they reach the 'Concluído' total status, except by Admins.
3. Ingredient stock updates must be accompanied by a stock movement log.
4. User profiles (`Admin` flag or roles) can only be set during initialization or by an existing Admin.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create an order with a `pizzeriaId` that doesn't match the user's profile.
2. **Privilege Escalation**: A 'Garçom' user attempting to update their own role to 'Admin' in `/users/{uid}`.
3. **Cross-Tenant Leak**: User A from Pizzeria 1 attempting to read `/pizzerias/pizzeria2/orders`.
4. **Invalid Order State**: Updating an order status directly to 'Concluído' without a payment method.
5. **Denial of Wallet**: Attempting to use a 1MB string as an `orderId`.
6. **Shadow Field Injection**: Adding an `isVerified: true` field to a Product document.
7. **Timestamp Spoofing**: Sending a `date` in the past when creating an order instead of using `request.time`.
8. **Relational Sync Break**: Creating an order item for a `productId` that doesn't exist.
9. **Total Bypass**: Force-updating the `total` of an order to 0.01 regardless of items.
10. **Admin Lockout**: Attempting to delete the last Admin user. (Note: difficult to enforce purely via rules without count, but we protect admin status).
11. **Negative Stock**: Setting `stock` to -1,000,000.
12. **PII Scraping**: Attempting to list all users in the system without a `pizzeriaId` filter.

## Test Runner (Draft)
Testing will be performed using the Firestore Emulator suite.
- Verify `PERMISSION_DENIED` for all above payloads.
- Verify `ALLOW` for valid operations by authenticated users within their tenant.
