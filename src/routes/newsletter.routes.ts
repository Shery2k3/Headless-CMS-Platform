import { Hono } from 'hono';
import { subscribeToNewsletter } from '../controllers/newsletter.controller.js';

const router = new Hono();

// Route to handle newsletter subscription
router.post('/subscribe', subscribeToNewsletter);

export default router;