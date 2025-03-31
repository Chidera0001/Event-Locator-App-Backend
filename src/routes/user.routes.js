const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

// Profile routes
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', userController.getProfile);

const updateProfileValidation = [
  body('username').optional().trim().isLength({ min: 3, max: 50 }),
  body('email').optional().trim().isEmail(),
  body('language').optional().isIn(['en', 'es', 'fr', 'de'])
];

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               language:
 *                 type: string
 *                 enum: [en, es, fr, de]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', updateProfileValidation, validate, userController.updateProfile);

// Password update
const updatePasswordValidation = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
];

router.put('/password', updatePasswordValidation, validate, userController.updatePassword);

// Location routes
/**
 * @swagger
 * components:
 *   schemas:
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
 *           example: -1.9441  # Kigali latitude
 *           description: "Latitude coordinate (e.g., -1.9441 for Kigali)"
 *         longitude:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           example: 30.0619  # Kigali longitude
 *           description: "Longitude coordinate (e.g., 30.0619 for Kigali)"
 *         address:
 *           type: string
 *           example: "KG 7 Ave, Kigali"
 *           description: "Physical address (e.g., street name, city)"
 * 
 * /api/users/location:
 *   put:
 *     summary: Update user's location
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLocation'
 *           example:
 *             latitude: -1.9441
 *             longitude: 30.0619
 *             address: "KG 7 Ave, Kigali"
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       400:
 *         description: Invalid coordinates
 *       401:
 *         description: Unauthorized
 *
 *   get:
 *     summary: Get user's location
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User location retrieved successfully
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
 *                     location:
 *                       $ref: '#/components/schemas/UserLocation'
 *                     example:
 *                       latitude: -1.9441
 *                       longitude: 30.0619
 *                       address: "KG 7 Ave, Kigali"
 */
const locationValidation = [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('address').optional().trim()
];

/**
 * @swagger
 * /api/users/location:
 *   get:
 *     summary: Get user location
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User location retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/location', userController.getLocation);
router.put('/location', locationValidation, validate, userController.updateLocation);

// Preferences routes
const preferencesValidation = [
  body('categories').isArray().withMessage('Categories must be an array'),
  body('categories.*').isUUID().withMessage('Each category must be a valid UUID')
];

/**
 * @swagger
 * components:
 *   schemas:
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
 *           description: "Array of category UUIDs the user is interested in"
 *           example: [
 *             "550e8400-e29b-41d4-a716-446655440000",  # Technology events
 *             "650e8400-e29b-41d4-a716-446655440001"   # Music events
 *           ]
 *         notification_radius:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           description: "Radius in kilometers for event notifications"
 *           example: 10
 *         email_notifications:
 *           type: boolean
 *           default: true
 *           description: "Whether to receive email notifications"
 *           example: true
 * 
 * /api/users/preferences:
 *   put:
 *     summary: Update user's preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreferences'
 *           example:
 *             categories: [
 *               "550e8400-e29b-41d4-a716-446655440000",  # Technology events
 *               "650e8400-e29b-41d4-a716-446655440001"   # Music events
 *             ]
 *             notification_radius: 10
 *             email_notifications: true
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       400:
 *         description: Invalid category IDs
 *       401:
 *         description: Unauthorized
 *
 *   get:
 *     summary: Get user's preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
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
 *                     preferences:
 *                       $ref: '#/components/schemas/UserPreferences'
 */
router.get('/preferences', userController.getPreferences);
router.put('/preferences', preferencesValidation, validate, userController.updatePreferences);

/**
 * @swagger
 * /api/users/preferences:
 *   get:
 *     summary: Get user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
 *       401:
 *         description: Unauthorized
 */

// Favorites routes
router.get('/favorites', userController.getFavorites);

module.exports = router; 