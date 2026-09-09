import { Router } from 'express';
import { createProduct, deleteProduct, listAllProducts, listProducts, updateProduct } from '../controllers/productController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();
router.get('/', protect, listProducts);
router.get('/all', protect, authorize('admin', 'sales'), listAllProducts);
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
export default router;