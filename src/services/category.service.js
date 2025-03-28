const categoryModel = require('../models/category.model');

const CategoryService = {
  async getAllCategories() {
    return categoryModel.getAllCategories();
  },
  
  async getCategoryById(id) {
    return categoryModel.getCategoryById(id);
  }
};

module.exports = CategoryService; 