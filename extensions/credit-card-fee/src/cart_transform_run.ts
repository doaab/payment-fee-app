import type {
  CartTransformRunInput,
  CartTransformRunResult,
  Operation,
} from "../generated/api";

const FEE_VARIANT_ID = "gid://shopify/ProductVariant/44501867167809";
const FEE_PERCENTAGE = 0.03; // 3%

export function cartTransformRun(input: CartTransformRunInput): CartTransformRunResult {
  console.log("=== Cart Transform Function is running ===");
  console.log("Number of lines:", input.cart.lines.length);

  const operations: Operation[] = [];

  // حساب المجموع
  let subtotal = 0;
  for (const line of input.cart.lines) {
    if (
      line.merchandise.__typename === "ProductVariant" &&
      line.merchandise.id === FEE_VARIANT_ID
    ) {
      continue;
    }
    subtotal += parseFloat(line.cost.totalAmount.amount);
  }

  console.log("Subtotal:", subtotal);

  if (subtotal <= 0) {
    return { operations: [] };
  }

  const feeAmount = (subtotal * FEE_PERCENTAGE).toFixed(2);
  console.log("Fee amount:", feeAmount);

  // هل منتج الرسوم موجود؟
  const feeLineExists = input.cart.lines.some(
    (line) =>
      line.merchandise.__typename === "ProductVariant" &&
      line.merchandise.id === FEE_VARIANT_ID
  );

  if (!feeLineExists) {
    // نحاول إضافة الرسم باستخدام أول منتج كأساس
    const firstLine = input.cart.lines[0];
    if (firstLine && firstLine.merchandise.__typename === "ProductVariant") {
      operations.push({
        lineExpand: {
          cartLineId: firstLine.id,
          expandedCartItems: [
            {
              merchandiseId: firstLine.merchandise.id,
              quantity: firstLine.quantity,
            },
            {
              merchandiseId: FEE_VARIANT_ID,
              quantity: 1,
              price: {
                adjustment: {
                  fixedPricePerUnit: {
                    amount: feeAmount,
                  },
                },
              },
            },
          ],
        },
      });
    }
  }

  return { operations };
}
