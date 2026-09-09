import { Router } from 'express';
import { acceptCounter, generatePdf, getQuote, listQuotes, submitCounterOffer, submitQuote } from '../controllers/negotiationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();
router.get('/quotes', protect, listQuotes);
router.post('/submit', protect, submitQuote);
router.post('/counter', protect, submitCounterOffer);
router.get('/quote/:id', protect, getQuote);
router.post('/accept', protect, acceptCounter);
router.get('/quote/:id/pdf', protect, generatePdf);
export default router;