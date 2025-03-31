const express = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const validate = require('../middleware/validate');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */

// UUID validation helper
const isValidUUID = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// ID parameter validation
const validateUUID = param('id')
  .custom((value) => {
    if (!isValidUUID(value)) {
      throw new Error('Invalid UUID format');
    }
    return true;
  });

// All routes require authentication and admin role
router.use(authenticate, adminOnly);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', validateUUID, validate, adminController.getUser);
router.put('/users/:id/role', 
  validateUUID,
  body('role').isIn(['user', 'admin']),
  validate,
  adminController.updateUserRole
);
router.put('/users/:id/status',
  validateUUID,
  body('status').isIn(['active', 'inactive', 'suspended']),
  validate,
  adminController.updateUserStatus
);
router.delete('/users/:id', validateUUID, validate, adminController.deleteUser);

// Event management routes
router.get('/events', adminController.getAllEvents);
router.put('/events/:id/status',
  validateUUID,
  body('status').isIn(['active', 'cancelled', 'completed']),
  validate,
  adminController.updateEventStatus
);
router.delete('/events/:id', validateUUID, validate, adminController.deleteEvent);

// Category management routes
router.get('/categories', adminController.getAllCategories);
router.post('/categories',
  body('name').isObject(),
  validate,
  adminController.createCategory
);
router.put('/categories/:id',
  validateUUID,
  body('name').isObject(),
  validate,
  adminController.updateCategory
);
router.delete('/categories/:id', validateUUID, validate, adminController.deleteCategory);

// System management routes
router.get('/stats', adminController.getSystemStats);
router.get('/logs', adminController.getSystemLogs);

module.exports = router; 