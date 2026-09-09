import assert from 'node:assert/strict';
import test from 'node:test';
import { submitCounterOffer } from '../controllers/negotiationController.js';
import Quote from '../models/Quote.js';
import PricingRule from '../models/PricingRule.js';
import Product from '../models/Product.js';
import { calculateNegotiation } from '../utils/negotiationEngine.js';

test('calculateNegotiation applies payment-term adjustments and cash-flow guardrails', () => {
  const rule = { baseUnitPrice: 1200, minimumMarginFloorPrice: 890, tierDiscounts: [], maxPaymentTermDays: 60, allowMilestonePayments: false };
  const product = { costPrice: 800, minMarginPercentage: 25 };
  assert.equal(calculateNegotiation(rule, product, 10, 1100, 'NET_15').paymentTermAdjustmentPercentage, -2);
  assert.equal(calculateNegotiation(rule, product, 10, 1100, 'NET_60').paymentTermAdjustmentPercentage, 1.5);
  assert.equal(calculateNegotiation(rule, product, 10, 1100, 'NET_90').paymentTermGuardrailBreached, true);
  assert.equal(calculateNegotiation(rule, product, 10, 1100, 'MILESTONE').paymentTermGuardrailBreached, true);
});

test('submitCounterOffer records history, enforces the margin floor, and emits buyer and sales updates', async () => {
  const quote = {
    _id: 'quote-1',
    buyerId: 'buyer-1',
    productId: 'product-1',
    requestedQty: 50,
    offeredUnitPrice: 1100,
    counterUnitPrice: 1120,
    status: 'countered',
    expiresAt: new Date(Date.now() + 60_000),
    history: [],
    turnCount: 2,
    async save() { return this; }
  };
  const rule = {
    minimumMarginFloorPrice: 890,
    baseUnitPrice: 1200,
    tierDiscounts: [{ minQty: 10, discountPercentage: 5 }]
  };
  const product = { costPrice: 800, minMarginPercentage: 25, isActive: true };
  const originalQuoteFindOne = Quote.findOne;
  const originalQuoteFindById = Quote.findById;
  const originalRuleFindOne = PricingRule.findOne;
  const originalProductFindById = Product.findById;
  try {
    Quote.findOne = async () => quote;
    Quote.findById = () => ({ populate: () => ({ populate: async () => quote }) });
    PricingRule.findOne = async () => rule;
    Product.findById = async () => product;

    const emitted = [];
    const req = {
      body: { quoteId: quote._id, offeredUnitPrice: 1000 },
      user: { _id: quote.buyerId },
      app: { get: () => ({ to: (room) => ({ emit: (event, payload) => emitted.push({ room, event, payload }) }) }) }
    };
    const response = {};
    const res = { json(payload) { response.payload = payload; } };

    await submitCounterOffer(req, res);

    assert.equal(response.payload.negotiation.status, 'rejected');
    assert.equal(response.payload.negotiation.minimumAllowedPrice, 1066.67);
    assert.equal(response.payload.negotiation.guardrailBreached, true);
    assert.equal(quote.status, 'rejected');
    assert.equal(quote.counterUnitPrice, 1066.67);
    assert.equal(quote.turnCount, 5);
    assert.equal(quote.history.length, 3);
    assert.deepEqual(quote.history.map((turn) => turn.senderRole), ['system', 'buyer', 'system']);
    assert.equal(quote.history[1].unitPrice, 1000);
    assert.equal(emitted.length, 4);
    assert.deepEqual(emitted.map(({ room, event }) => `${room}:${event}`), [
      'buyer:buyer-1:quote_updated',
      'buyer:buyer-1:quote_history_updated',
      'sales:quote_updated',
      'sales:quote_history_updated'
    ]);
  } finally {
    Quote.findOne = originalQuoteFindOne;
    Quote.findById = originalQuoteFindById;
    PricingRule.findOne = originalRuleFindOne;
    Product.findById = originalProductFindById;
  }
});
