const express = require('express');
const { body, query, param } = require('express-validator');
const eventController = require('../controllers/event.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const validate = require('../middleware/validate');
const { isValidUUID } = require('../utils/validation');

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
 *         - description
 *         - location
 *         - address
 *         - startDate
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           example: "Tech Conference 2025"
 *         description:
 *           type: string
 *           example: "Annual technology conference featuring the latest innovations"
 *         location:
 *           type: object
 *           required:
 *             - type
 *             - coordinates
 *           properties:
 *             type:
 *               type: string
 *               enum: ["Point"]
 *               example: "Point"
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               minItems: 2
 *               maxItems: 2
 *               description: "[longitude, latitude] - Note: longitude comes first"
 *               example: [-73.935242, 40.730610]
 *         address:
 *           type: string
 *           example: "123 Main St, New York, NY 10001"
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: "2024-03-20T18:00:00.000Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: "2024-03-20T21:00:00.000Z"
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *             example: "550e8400-e29b-41d4-a716-446655440000"
 *
 *     UserPreferences:
 *       type: object
 *       required:
 *         - categories
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           example: ["550e8400-e29b-41d4-a716-446655440000"]
 *
 *     UserProfile:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           example: "johndoe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         preferred_language:
 *           type: string
 *           enum: ["en", "fr", "es"]
 *           example: "en"
 *
 *     UserLocation:
 *       type: object
 *       required:
 *         - latitude
 *         - longitude
 *         - address
 *       properties:
 *         latitude:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           example: 40.730610
 *         longitude:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           example: -73.935242
 *         address:
 *           type: string
 *           example: "123 Main St, New York, NY 10001"
 *
 *     Review:
 *       type: object
 *       required:
 *         - rating
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         comment:
 *           type: string
 *           example: "Great event! Very well organized."
 *
 *     Auth:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: "Password123!"
 *
 *     Register:
 *       allOf:
 *         - $ref: '#/components/schemas/Auth'
 *         - type: object
 *           required:
 *             - username
 *           properties:
 *             username:
 *               type: string
 *               minLength: 3
 *               maxLength: 50
 *               example: "johndoe"
 *             language:
 *               type: string
 *               enum: ["en", "fr", "es"]
 *               default: "en"
 *               example: "en"
 *
 *     SearchParams:
 *       type: object
 *       required:
 *         - latitude
 *         - longitude
 *         - radius
 *       properties:
 *         latitude:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           example: 40.730610
 *         longitude:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           example: -73.935242
 *         radius:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: "Search radius in kilometers"
 *           example: 5
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           example: 20
 *         offset:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           example: 0
 */

/**
 * @swagger
 * /api/events:
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
 *   
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
 *       400:
 *         description: Invalid input
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
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event details retrieved successfully
 *       404:
 *         description: Event not found
 *
 *   put:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 *
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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
 *           minimum: -90
 *           maximum: 90
 *           example: 40.730610
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           example: -73.935242
 *       - in: query
 *         name: radius
 *         required: true
 *         schema:
 *           type: number
 *           minimum: 0
 *           example: 5
 *           description: "Search radius in kilometers"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Events found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
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
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event added to favorites
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
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
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event removed from favorites
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/events/{id}/reviews:
 *   get:
 *     summary: Get event reviews
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       404:
 *         description: Event not found
 *
 *   post:
 *     summary: Add a review
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 */

/**
 * @swagger
 * /api/admin/events:
 *   get:
 *     summary: Get all events (Admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All events retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */

// ID parameter validation
const validateUUID = param('id')
  .custom((value) => {
    if (!isValidUUID(value)) {
      throw new Error('Invalid UUID format');
    }
    return true;
  });

// ==================== VALIDATION SCHEMAS ====================
const eventValidation = [
  body('title').trim().isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description').optional().trim(),
  body('location').isObject()
    .withMessage('Location must be a GeoJSON Point object'),
  body('location.type').equals('Point')
    .withMessage('Location type must be "Point"'),
  body('location.coordinates').isArray()
    .withMessage('Coordinates must be an array'),
  body('location.coordinates').custom((coords) => {
    if (!Array.isArray(coords) || coords.length !== 2) {
      throw new Error('Coordinates must be an array of [longitude, latitude]');
    }
    const [lng, lat] = coords;
    if (lng < -180 || lng > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    return true;
  }),
  body('address').trim().notEmpty()
    .withMessage('Address is required'),
  body('startDate').isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .notEmpty()
    .withMessage('Start date is required'),
  body('endDate').optional().isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  body('categories').optional().isArray()
    .withMessage('Categories must be an array'),
  body('categories.*').optional().isUUID()
    .withMessage('Each category must be a valid UUID')
];

const locationSearchValidation = [
  query('latitude').isFloat({ min: -90, max: 90 }),
  query('longitude').isFloat({ min: -180, max: 180 }),
  query('radius').isFloat({ min: 0 })
];

const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }),
  body('review').optional().trim()
];

// ==================== PUBLIC ROUTES ====================
/**
 * Public Event Routes
 * No authentication required
 */
router.get('/', eventController.getEvents);
router.get('/:id', validateUUID, eventController.getEvent);
router.get('/search/location', locationSearchValidation, validate, eventController.searchEventsByLocation);
router.get('/category/:id', validateUUID, eventController.getEventsByCategory);
router.get('/:id/reviews', validateUUID, eventController.getReviews);

// ==================== AUTHENTICATED USER ROUTES ====================
/**
 * Protected Event Routes
 * Requires user authentication
 */
router.use(authenticate);

// Event Management
router.post('/', eventValidation, validate, eventController.createEvent);
router.put('/:id', validateUUID, eventValidation, validate, eventController.updateEvent);
router.delete('/:id', validateUUID, eventController.deleteEvent);

// Favorites
router.post('/:id/favorite', validateUUID, eventController.addToFavorites);
router.delete('/:id/favorite', validateUUID, eventController.removeFromFavorites);
router.get('/user/favorites', eventController.getFavorites);

// Reviews
router.post('/:id/reviews', validateUUID, reviewValidation, validate, eventController.addReview);

// ==================== ADMIN ROUTES ====================
/**
 * Admin Event Routes
 * Requires admin privileges
 */
router.use('/admin', adminOnly);

// Admin Event Management
router.get('/admin/all', eventController.getAllEvents);
router.put('/admin/:id', validateUUID, eventValidation, validate, eventController.updateEvent);
router.delete('/admin/:id', validateUUID, eventController.deleteEventAdmin);
router.put('/admin/:id/status', 
  validateUUID,
  body('status').isIn(['active', 'cancelled', 'completed']),
  validate,
  eventController.updateEventStatus
);

module.exports = router; 