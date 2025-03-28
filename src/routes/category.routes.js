const express = require('express');
const categoryController = require('../controllers/category.controller');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Categories are public
router.get('/', optionalAuth, categoryController.getAllCategories);
router.get('/:id', optionalAuth, categoryController.getCategory);

module.exports = router; 