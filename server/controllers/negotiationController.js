import Quote from '../models/Quote.js';
import PricingRule from '../models/PricingRule.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { calculateNegotiation } from '../utils/negotiationEngine.js';
import { createPurchaseOrderPdf } from '../services/pdfService.js';

const emitStockUpdate = (req, product) => {
  req.app.get('io').emit('stock_level_updated', {
    productId: product._id,
    currentStock: product.currentStock,
    reservedStock: product.reservedStock,
    availableStock: product.availableStock
  });
};

const reserveStock = async (req, productId, quantity) => {
  if (!quantity) return true;
  const reserved = await Product.findOneAndUpdate(
    { _id: productId, $expr: { $gte: [{ $subtract: ['$currentStock', '$reservedStock'] }, quantity] } },
    { $inc: { reservedStock: quantity } },
    { new: true }
  );
  if (reserved) emitStockUpdate(req, reserved);
  return reserved;
};

export const submitQuote = async (req, res) => {
  const { productId, requestedQty, offeredUnitPrice, paymentTerms = 'NET_30', customPaymentTerms } = req.body;
  const rule = await PricingRule.findOne({ productId });
  if (!rule) return res.status(404).json({ message: 'Pricing rule not found for this product' });
  const product = await Product.findById(productId);
  if (!product || !product.isActive) return res.status(404).json({ message: 'Active product not found' });
  if (!Number.isInteger(Number(requestedQty)) || Number(requestedQty) < 1 || Number(offeredUnitPrice) < 0) return res.status(400).json({ message: 'Quantity and price must be valid positive values' });
  const quantity = Number(requestedQty);
  const price = Number(offeredUnitPrice);
  const result = calculateNegotiation(rule, product, quantity, price, paymentTerms);
  const stockNote = result.stockFulfillmentStatus === 'in_stock' ? 'Stock available for requested quantity' : `${result.fulfillmentQuantity} units available now; ${result.backorderQuantity} units require restock${result.restockLeadTimeDays ? ` in approximately ${result.restockLeadTimeDays} days` : ''}`;
  const responseNote = result.paymentTermGuardrailBreached ? 'Rejected because the requested payment terms violate cash-flow policy' : result.guardrailBreached ? `Rejected below the minimum payable price of ${result.minimumPayablePrice.toFixed(2)}` : result.status === 'approved' ? `Approved by pricing rules. ${stockNote}` : `Counter offer generated. ${stockNote}`;
  if (result.status === 'approved' && !await reserveStock(req, productId, result.fulfillmentQuantity)) return res.status(409).json({ message: 'Stock changed while approving this quote. Please retry.' });
  const quote = await Quote.create({ buyerId: req.user._id, productId, requestedQty: quantity, fulfillmentQuantity: result.fulfillmentQuantity, backorderQuantity: result.backorderQuantity, restockLeadTimeDays: result.restockLeadTimeDays, stockFulfillmentStatus: result.stockFulfillmentStatus, offeredUnitPrice: price, status: result.status, approvedAt: result.status === 'approved' ? new Date() : undefined, counterUnitPrice: result.counterUnitPrice, paymentTerms: result.paymentTerms, customPaymentTerms, paymentTermAdjustmentPercentage: result.paymentTermAdjustmentPercentage, paymentTermAdjustmentAmount: result.paymentTermAdjustmentAmount, paymentTermGuardrailBreached: result.paymentTermGuardrailBreached, history: [{ senderRole: 'buyer', unitPrice: price, quantity, note: `Initial offer with ${result.paymentTerms}` }, { senderRole: 'system', unitPrice: result.counterUnitPrice, quantity, note: responseNote }], turnCount: 2 });
  const populated = await Quote.findById(quote._id).populate('productId', 'name sku description image').populate('buyerId', 'name email');
  req.app.get('io').to(`buyer:${req.user._id}`).emit('quote_updated', populated);
  req.app.get('io').to(`buyer:${req.user._id}`).emit('quote_history_updated', populated);
  req.app.get('io').to('sales').emit('quote_updated', populated);
  req.app.get('io').to('sales').emit('quote_history_updated', populated);
  res.status(201).json({ quote: populated, negotiation: result });
};

export const submitCounterOffer = async (req, res) => {
  const { quoteId, offeredUnitPrice, paymentTerms, customPaymentTerms } = req.body;
  const quote = await Quote.findOne({ _id: quoteId, buyerId: req.user._id });
  if (!quote) return res.status(404).json({ message: 'Quote not found' });
  if (!['countered', 'rejected'].includes(quote.status)) return res.status(400).json({ message: 'Only an active countered quote can receive another offer' });
  if (quote.expiresAt <= new Date()) return res.status(400).json({ message: 'Quote has expired' });
  const [rule, product] = await Promise.all([PricingRule.findOne({ productId: quote.productId }), Product.findById(quote.productId)]);
  if (!rule || !product) return res.status(404).json({ message: 'Pricing configuration not found' });
  const price = Number(offeredUnitPrice);
  if (!Number.isFinite(price) || price < 0) return res.status(400).json({ message: 'Offer price must be a valid positive value' });
  const selectedPaymentTerms = paymentTerms || quote.paymentTerms || 'NET_30';
  const result = calculateNegotiation(rule, product, quote.requestedQty, price, selectedPaymentTerms);
  if (result.status === 'approved' && !await reserveStock(req, quote.productId, result.fulfillmentQuantity)) return res.status(409).json({ message: 'Stock changed while approving this quote. Please retry.' });
  quote.history.push({ senderRole: 'system', unitPrice: quote.counterUnitPrice || quote.offeredUnitPrice, quantity: quote.requestedQty, note: `Previous ${quote.status} quote` });
  quote.history.push({ senderRole: 'buyer', unitPrice: price, quantity: quote.requestedQty, note: `Counter offer with ${result.paymentTerms}` });
  quote.history.push({ senderRole: 'system', unitPrice: result.counterUnitPrice, quantity: quote.requestedQty, note: result.paymentTermGuardrailBreached ? 'Rejected by payment-term cash-flow guardrail' : result.guardrailBreached ? `Rejected below the minimum payable price of ${result.minimumPayablePrice.toFixed(2)}` : result.status === 'approved' ? 'Approved by pricing rules' : 'Counter offer generated' });
  quote.offeredUnitPrice = price;
  quote.counterUnitPrice = result.counterUnitPrice;
  quote.status = result.status;
  quote.approvedAt = result.status === 'approved' ? new Date() : undefined;
  quote.paymentTerms = result.paymentTerms;
  quote.customPaymentTerms = customPaymentTerms || quote.customPaymentTerms;
  quote.paymentTermAdjustmentPercentage = result.paymentTermAdjustmentPercentage;
  quote.paymentTermAdjustmentAmount = result.paymentTermAdjustmentAmount;
  quote.paymentTermGuardrailBreached = result.paymentTermGuardrailBreached;
  quote.fulfillmentQuantity = result.fulfillmentQuantity;
  quote.backorderQuantity = result.backorderQuantity;
  quote.restockLeadTimeDays = result.restockLeadTimeDays;
  quote.stockFulfillmentStatus = result.stockFulfillmentStatus;
  quote.turnCount += 3;
  await quote.save();
  const populated = await Quote.findById(quote._id).populate('productId', 'name sku description image').populate('buyerId', 'name email');
  req.app.get('io').to(`buyer:${req.user._id}`).emit('quote_updated', populated);
  req.app.get('io').to(`buyer:${req.user._id}`).emit('quote_history_updated', populated);
  req.app.get('io').to('sales').emit('quote_updated', populated);
  req.app.get('io').to('sales').emit('quote_history_updated', populated);
  res.json({ quote: populated, negotiation: result });
};

export const getQuote = async (req, res) => {
  const quote = await Quote.findOne({ _id: req.params.id, buyerId: req.user._id }).populate('productId').populate('buyerId', 'name email');
  if (!quote) return res.status(404).json({ message: 'Quote not found' });
  res.json(quote);
};

export const listQuotes = async (req, res) => {
  const filter = req.user.role === 'buyer' ? { buyerId: req.user._id } : {};
  res.json(await Quote.find(filter).populate('productId', 'name sku image').populate('buyerId', 'name email').sort({ createdAt: -1 }).limit(50));
};

export const acceptCounter = async (req, res) => {
  const quote = await Quote.findOne({ _id: req.body.quoteId, buyerId: req.user._id });
  if (!quote) return res.status(404).json({ message: 'Quote not found' });
  if (quote.status !== 'countered') return res.status(400).json({ message: 'Only countered quotes can be accepted' });
  quote.status = 'approved';
  const reserved = await reserveStock(req, quote.productId, quote.fulfillmentQuantity ?? quote.requestedQty);
  if (!reserved) return res.status(409).json({ message: 'Stock is no longer available for this quote.' });
  quote.approvedAt = new Date();
  quote.pdfGeneratedAt = new Date();
  quote.history.push({ senderRole: 'buyer', unitPrice: quote.counterUnitPrice, quantity: quote.requestedQty, note: 'Accepted counter offer' });
  quote.turnCount += 1;
  await quote.save();
  req.app.get('io').to(`buyer:${req.user._id}`).emit('quote_updated', quote);
  req.app.get('io').to(`buyer:${req.user._id}`).emit('quote_history_updated', quote);
  res.json({ quote, pdfUrl: `/api/negotiation/quote/${quote._id}/pdf` });
};

export const generatePdf = async (req, res) => {
  const quote = await Quote.findOne({ _id: req.params.id, buyerId: req.user._id });
  if (!quote || quote.status !== 'approved') return res.status(404).json({ message: 'Approved quote not found' });
  const [buyer, product] = await Promise.all([User.findById(quote.buyerId), Product.findById(quote.productId)]);
  const pdf = await createPurchaseOrderPdf({ quote, buyer, product });
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="purchase-order-${quote._id}.pdf"` }).send(pdf);
};