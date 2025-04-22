import { Hono } from 'hono';
import { ContactController } from '../controllers/contact.controller.js';

const contactRoutes = new Hono();
const contactController = new ContactController();

// POST /contact/submit - Submit contact form
contactRoutes.post('/submit', (c) => contactController.submitContactForm(c));

// POST /contact/contribute - Submit contribution/pitch form
contactRoutes.post('/contribute', (c) => contactController.submitContributionForm(c));

export default contactRoutes;