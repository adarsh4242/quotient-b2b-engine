import { Router } from 'express';
import { getRuleForProduct, listRules, upsertRule } from '../controllers/pricingRuleController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();
router.get('/', protect, authorize('admin', 'sales'), listRules);
router.get('/product/:productId', protect, getRuleForProduct);
router.put('/', protect, authorize('admin'), upsertRule);
export default router;