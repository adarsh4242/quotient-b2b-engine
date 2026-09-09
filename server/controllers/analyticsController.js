import Quote from '../models/Quote.js';

const approvedStatuses = ['approved'];
const closedStatuses = ['approved', 'expired', 'rejected'];

export const getAnalytics = async (req, res) => {
  const [summary] = await Quote.aggregate([
    { $match: { status: { $in: closedStatuses } } },
    { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    { $set: {
      dealPrice: { $cond: [{ $eq: ['$status', 'approved'] }, { $ifNull: ['$counterUnitPrice', '$offeredUnitPrice'] }, null] },
      approvalDurationDays: { $cond: [{ $and: [{ $eq: ['$status', 'approved'] }, { $ne: ['$approvedAt', null] }] }, { $divide: [{ $subtract: ['$approvedAt', '$createdAt'] }, 86400000] }, null] }
    } },
    { $set: { marginPercentage: { $cond: [{ $and: [{ $eq: ['$status', 'approved'] }, { $gt: ['$dealPrice', 0] }, { $ne: ['$product.costPrice', null] }] }, { $multiply: [{ $divide: [{ $subtract: ['$dealPrice', '$product.costPrice'] }, '$dealPrice'] }, 100] }, null] } } },
    { $group: {
      _id: null,
      totalClosed: { $sum: 1 },
      approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
      expiredOrRejected: { $sum: { $cond: [{ $in: ['$status', ['expired', 'rejected']] }, 1, 0] } },
      averageDealMargin: { $avg: '$marginPercentage' },
      averageNegotiationDurationDays: { $avg: '$approvalDurationDays' }
    } }
  ]);

  const topProducts = await Quote.aggregate([
    { $match: { status: { $in: ['countered', 'approved', 'expired', 'rejected'] } } },
    { $group: { _id: '$productId', counterOfferVolume: { $sum: { $cond: [{ $in: ['$status', ['countered', 'approved']] }, 1, 0] } }, totalQuotes: { $sum: 1 } } },
    { $sort: { counterOfferVolume: -1, totalQuotes: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $project: { _id: 0, productId: '$_id', name: '$product.name', sku: '$product.sku', counterOfferVolume: 1, totalQuotes: 1 } }
  ]);

  const totalClosed = summary?.totalClosed || 0;
  const approved = summary?.approved || 0;
  res.json({
    summary: {
      averageDealMargin: Number(summary?.averageDealMargin || 0).toFixed(1),
      averageNegotiationDurationDays: Number(summary?.averageNegotiationDurationDays || 0).toFixed(1),
      approved,
      expiredOrRejected: summary?.expiredOrRejected || 0,
      conversionRate: totalClosed ? Number((approved / totalClosed * 100).toFixed(1)) : 0
    },
    topProducts
  });
};