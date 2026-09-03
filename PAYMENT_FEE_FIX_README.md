# Payment fee Cart Transform fix

This package fixes the Cart Transform rejection caused by mixing priced and
unpriced `expandedCartItems`.

## Files

- `extensions/credit-card-fee/src/cart_transform_run.ts`
- `extensions/credit-card-fee/tests/fixtures/no-operations.json`
- `extensions/credit-card-fee/tests/fixtures/add-fee.json`

## Important store check

`FEE_VARIANT_ID` must be the `Credit Card Processing Fee` variant in the same
Shopify test store where the app is installed. Update the constant if the test
store variant ID is different.

## Apply

Replace the files while preserving their paths, then run:

```bash
shopify app function build
shopify app dev
```

If the Cart Transform was never activated on this store, execute once:

```graphql
mutation {
  cartTransformCreate(functionHandle: "credit-card-fee") {
    cartTransform {
      id
      functionId
    }
    userErrors {
      field
      message
    }
  }
}
```

Do not create a second Cart Transform if one already exists for this app.
