import type {
  CartTransformRunInput,
  CartTransformRunResult,
  Operation,
} from "../generated/api";

const FEE_VARIANT_ID = "gid://shopify/ProductVariant/44501867167809";
const FEE_PERCENTAGE = 0.03;
const NO_CHANGES: CartTransformRunResult = { operations: [] };

export function cartTransformRun(
  input: CartTransformRunInput,
): CartTransformRunResult {
  const merchandiseLines = input.cart.lines.filter(
    (line) =>
      line.merchandise.__typename === "ProductVariant" &&
      line.merchandise.id !== FEE_VARIANT_ID,
  );

  if (merchandiseLines.length === 0) {
    return NO_CHANGES;
  }

  const feeLineExists = input.cart.lines.some(
    (line) =>
      line.merchandise.__typename === "ProductVariant" &&
      line.merchandise.id === FEE_VARIANT_ID,
  );

  if (feeLineExists) {
    return NO_CHANGES;
  }

  const subtotal = merchandiseLines.reduce(
    (total, line) => total + Number(line.cost.totalAmount.amount),
    0,
  );

  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return NO_CHANGES;
  }

  // A quantity-one parent preserves the 3% fee exactly to the cent.
  const parentLine =
    merchandiseLines.find((line) => line.quantity === 1) ?? merchandiseLines[0];

  if (!parentLine || parentLine.merchandise.__typename !== "ProductVariant") {
    return NO_CHANGES;
  }

  const feeTotal = Number((subtotal * FEE_PERCENTAGE).toFixed(2));
  const feePerParentUnit = (feeTotal / parentLine.quantity).toFixed(2);

  if (Number(feePerParentUnit) <= 0) {
    return NO_CHANGES;
  }

  const operations: Operation[] = [
    {
      lineExpand: {
        cartLineId: parentLine.id,
        expandedCartItems: [
          {
            merchandiseId: parentLine.merchandise.id,
            quantity: 1,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: parentLine.cost.amountPerQuantity.amount,
                },
              },
            },
          },
          {
            merchandiseId: FEE_VARIANT_ID,
            quantity: 1,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: feePerParentUnit,
                },
              },
            },
          },
        ],
      },
    },
  ];

  return { operations };
}
