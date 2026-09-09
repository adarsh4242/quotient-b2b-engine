const defaultPaymentTerms = {
  NET_15: { adjustmentPercentage: -2, days: 15 },
  NET_30: { adjustmentPercentage: 0, days: 30 },
  NET_60: { adjustmentPercentage: 1.5, days: 60 },
  NET_90: { adjustmentPercentage: 1.5, days: 90 },
  MILESTONE: { adjustmentPercentage: 0, days: 0 }
};

const roundMoney = (value) => Number(value.toFixed(2));

export const calculateNegotiation = (rule, product, requestedQty, targetUnitPrice, requestedPaymentTerms = 'NET_30') => {
  const availableStock = Math.max(0, Number(product.availableStock ?? ((product.currentStock || 0) - (product.reservedStock || 0))));
  const fulfillmentQuantity = Math.min(requestedQty, availableStock);
  const backorderQuantity = Math.max(0, requestedQty - availableStock);
  const stockFulfillmentStatus = backorderQuantity === 0 ? 'in_stock' : fulfillmentQuantity > 0 ? 'partial' : 'backorder';
  const tiers = [...rule.tierDiscounts].sort((a, b) => b.minQty - a.minQty);
  const applicableTier = tiers.find((tier) => requestedQty >= tier.minQty);
  const applicableDiscount = applicableTier?.discountPercentage || 0;
  const standardTierUnitPrice = Number((rule.baseUnitPrice * (1 - applicableDiscount / 100)).toFixed(2));
  const configuredMarginFloor = product.costPrice != null && product.minMarginPercentage != null
    ? product.costPrice / (1 - product.minMarginPercentage / 100)
    : rule.minimumMarginFloorPrice;
  const minimumAllowedPrice = Number(Math.max(rule.minimumMarginFloorPrice, configuredMarginFloor).toFixed(2));
  const paymentTerm = defaultPaymentTerms[requestedPaymentTerms] ? requestedPaymentTerms : 'NET_30';
  const configuredTerm = rule.paymentTermAdjustments?.find((item) => item.term === paymentTerm);
  const adjustmentPercentage = configuredTerm?.adjustmentPercentage ?? defaultPaymentTerms[paymentTerm].adjustmentPercentage;
  const termDays = defaultPaymentTerms[paymentTerm].days;
  const paymentTermGuardrailBreached = configuredTerm?.allowed === false || (paymentTerm === 'MILESTONE' ? rule.allowMilestonePayments === false : termDays > (rule.maxPaymentTermDays ?? 90));
  const adjustmentMultiplier = 1 + adjustmentPercentage / 100;
  const standardTermUnitPrice = roundMoney(standardTierUnitPrice * adjustmentMultiplier);
  const minimumPayablePrice = roundMoney(minimumAllowedPrice * adjustmentMultiplier);
  const effectiveTargetPrice = roundMoney(targetUnitPrice * adjustmentMultiplier);
  const guardrailBreached = paymentTermGuardrailBreached || effectiveTargetPrice < minimumPayablePrice;
  let status = 'countered';
  let counterUnitPrice = minimumPayablePrice;

  if (guardrailBreached) {
    status = 'rejected';
  } else if (effectiveTargetPrice >= standardTermUnitPrice) {
    status = 'approved';
    counterUnitPrice = effectiveTargetPrice;
  } else {
    counterUnitPrice = roundMoney((standardTermUnitPrice + effectiveTargetPrice) / 2);
  }

  return { status, counterUnitPrice, standardTierUnitPrice, standardTermUnitPrice, applicableDiscount, applicableTier, minimumAllowedPrice, minimumPayablePrice, guardrailBreached, paymentTerms: paymentTerm, paymentTermAdjustmentPercentage: adjustmentPercentage, paymentTermAdjustmentAmount: roundMoney(counterUnitPrice - (counterUnitPrice / adjustmentMultiplier)), paymentTermGuardrailBreached, effectiveTargetPrice, availableStock, fulfillmentQuantity, backorderQuantity, restockLeadTimeDays: backorderQuantity ? Number(product.leadTimeDays || 0) : 0, stockFulfillmentStatus };
};