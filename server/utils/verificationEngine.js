const averageRating = (ratings = []) => ratings.length ? ratings.reduce((total, rating) => total + Number(rating.score || 0), 0) / ratings.length : 0;

export const calculateVerification = (supplier) => {
  const gstScore = supplier.gstinStatus === 'verified' ? 30 : supplier.gstinStatus === 'pending' ? 10 : 0;
  const documentScore = Math.min(25, (supplier.documents || []).filter((document) => document.status === 'verified').length * 8.33);
  const tradeScore = Math.min(25, Number(supplier.tradeHistory?.completedOrders || 0) >= 100 ? 25 : Number(supplier.tradeHistory?.completedOrders || 0) / 4);
  const ratingScore = supplier.buyerRatings?.length ? averageRating(supplier.buyerRatings) / 5 * 15 : 0;
  const ageScore = Math.min(5, Number(supplier.businessAgeYears || 0) / 2);
  const disputePenalty = Math.min(10, Number(supplier.tradeHistory?.disputeRate || 0) / 5);
  const complianceScore = Math.max(0, Math.min(100, Math.round(gstScore + documentScore + tradeScore + ratingScore + ageScore - disputePenalty)));
  const verificationTier = complianceScore >= 80 ? 'Gold' : complianceScore >= 55 ? 'Silver' : 'Unverified';
  return { complianceScore, verificationTier, isVerified: verificationTier !== 'Unverified', verificationBadge: verificationTier === 'Gold' ? 'Gold Verified' : verificationTier === 'Silver' ? 'Silver Verified' : 'Unverified' };
};

export const applyVerification = (supplier) => {
  Object.assign(supplier, calculateVerification(supplier), { verifiedAt: calculateVerification(supplier).isVerified ? new Date() : undefined });
  return supplier;
};