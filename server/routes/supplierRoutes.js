import { Router } from 'express';
import { createSupplier, listSuppliers, listVerifiedSuppliers, reviewSupplier, supplierProducts, verifySupplier } from '../controllers/supplierController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();
router.get('/verified', protect, listVerifiedSuppliers);
router.get('/', protect, authorize('admin'), listSuppliers);
router.get('/:id/products', protect, authorize('admin'), supplierProducts);
router.post('/', protect, authorize('admin'), createSupplier);
router.patch('/:id', protect, authorize('admin'), reviewSupplier);
router.patch('/:id/verification', protect, authorize('admin'), verifySupplier);
export default router;