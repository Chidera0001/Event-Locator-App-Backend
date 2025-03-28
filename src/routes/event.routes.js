const express = require('express');
const { body, query, param } = require('express-validator');
const eventController = require('../controllers/event.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - latitude
 *         - longitude
 *         - startTime
 *       properties:
 *         title:
 *           type: string
 *           example: Tech Conference 2024
 *         description:
 *           type: string
 *           example: Annual technology conference
 *         latitude:
 *           type: number
 *           example: 40.7128
 *         longitude:
 *           type: number
 *           example: -74.0060
 *         address:
 *           type: string
 *           example: 123 Main St, New York, NY
 *         startTime:
 *           type: string
 *           format: date-time
 *           example: 2024-03-20T18:00:00Z
 *         endTime:
 *           type: string
 *           format: date-time
 *           example: 2024-03-20T21:00:00Z
 *         categories:
 *           type: array
 *           items:
 *             type: integer
 *           example: [1, 2]
 */

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created successfully
 *       401:
 *         description: Unauthorized
 * 
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of events retrieved successfully
 */

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event details retrieved successfully
 *       404:
 *         description: Event not found
 * 
 *   put:
 *     summary: Update event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 * 
 *   delete:
 *     summary: Delete event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/events/search/location:
 *   get:
 *     summary: Search events by location
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         required: true
 *         schema:
 *           type: number
 *           description: Search radius in kilometers
 *     responses:
 *       200:
 *         description: List of events within radius
 */

/**
 * @swagger
 * /api/events/{id}/favorite:
 *   post:
 *     summary: Add event to favorites
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event added to favorites
 *       401:
 *         description: Unauthorized
 * 
 *   delete:
 *     summary: Remove event from favorites
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event removed from favorites
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/events/{id}/reviews:
 *   post:
 *     summary: Add review to event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               review:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review added successfully
 *       401:
 *         description: Unauthorized
 * 
 *   get:
 *     summary: Get event reviews
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews retrieved successfully
 */

// Event creation/modification requires authentication
const eventValidation = [
  body('title').trim().isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
  body('description').optional().trim(),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('address').optional().trim(),
  body('startTime').isISO8601().withMessage('Start time must be a valid ISO date'),
  body('endTime').optional().isISO8601().withMessage('End time must be a valid ISO date'),
  body('categories').optional().isArray().withMessage('Categories must be an array')
];

// Create event (requires auth)
router.post('/', authenticate, eventValidation, validate, eventController.createEvent);

// List events (public)
router.get('/', optionalAuth, eventController.getEvents);

// Event details (public)
router.get('/:id', optionalAuth, eventController.getEvent);

// Update event (requires auth)
router.put('/:id', authenticate, eventValidation, validate, eventController.updateEvent);

// Delete event (requires auth)
router.delete('/:id', authenticate, eventController.deleteEvent);

// Search events by location (public)
const locationSearchValidation = [
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  query('radius').isFloat({ min: 0 }).withMessage('Radius must be positive')
];

router.get('/search/location', optionalAuth, locationSearchValidation, validate, eventController.searchEventsByLocation);

// Get events by category (public)
router.get('/category/:id', optionalAuth, eventController.getEventsByCategory);

// Favorites (requires auth)
router.post('/:id/favorite', authenticate, eventController.addToFavorites);
router.delete('/:id/favorite', authenticate, eventController.removeFromFavorites);

// Reviews (requires auth for posting)
const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().trim()
];

router.post('/:id/reviews', authenticate, reviewValidation, validate, eventController.addReview);
router.get('/:id/reviews', optionalAuth, eventController.getReviews);

module.exports = router; 