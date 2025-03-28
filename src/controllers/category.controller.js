const categoryService = require('../services/category.service');

const CategoryController = {
  async getAllCategories(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      
      res.status(200).json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      next(error);
    }
  },
  
  async getCategory(req, res, next) {
    try {
      const { id } = req.params;
      
      const category = await categoryService.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: req.t('notFound', { ns: 'error' })
        });
      }
      
      res.status(200).json({
        success: true,
        data: { category }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = CategoryController; 