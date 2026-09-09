import cron from 'node-cron';
import Quote from '../models/Quote.js';

const DEFAULT_VALIDITY_DAYS = 7;

export const expireStaleQuotes = async (io, validityDays = DEFAULT_VALIDITY_DAYS) => {
  const cutoff = new Date(Date.now() - validityDays * 24 * 60 * 60 * 1000);
  const candidates = await Quote.find({
    status: { $in: ['pending', 'countered'] },
    $or: [{ expiresAt: { $lte: new Date() } }, { updatedAt: { $lte: cutoff } }]
  }).select('_id buyerId requestedQty counterUnitPrice offeredUnitPrice');

  let expiredCount = 0;
  for (const candidate of candidates) {
    const unitPrice = candidate.counterUnitPrice ?? candidate.offeredUnitPrice;
    const expired = await Quote.findOneAndUpdate(
      { _id: candidate._id, status: { $in: ['pending', 'countered'] } },
      {
        $set: { status: 'expired' },
        $push: { history: { senderRole: 'system', unitPrice, quantity: candidate.requestedQty, note: 'Quote expired after the validity period' } }
      },
      { new: true }
    ).populate('productId', 'name sku image').populate('buyerId', 'name email');

    if (!expired) continue;
    expiredCount += 1;
    io.to(`buyer:${expired.buyerId._id || expired.buyerId}`).emit('quote_updated', expired);
    io.to('sales').emit('quote_updated', expired);
  }

  return expiredCount;
};

export const startQuoteExpiryCron = (io, validityDays = DEFAULT_VALIDITY_DAYS) => {
  const task = cron.schedule('0 * * * *', async () => {
    try {
      const expiredCount = await expireStaleQuotes(io, validityDays);
      if (expiredCount) console.log(`Expired ${expiredCount} stale quote(s)`);
    } catch (error) {
      console.error('Quote expiry job failed:', error.message);
    }
  });
  return task;
};