const route = require("@lib/route");
const validate = require("@lib/validate");
const { categorySchema } = require("../models/schemas/category");
const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/category");

const createCategoryHandler = async (req, res) => {
  validate(req.body, categorySchema);
  const result = await createCategory(req.body);

  res.status(201).json({
    isSuccess: true,
    status: "Success",
    message: "Category created successfully",
    category: result,
  });
};

const getAllCategoriesHandler = async (req, res) => {
  const result = await getAllCategories();

  res.json({
    isSuccess: true,
    status: "Success",
    categories: result,
  });
};

const updateCategoryHandler = async (req, res) => {
  validate(req.body, categorySchema);
  const result = await updateCategory(req.params.id, req.body);

  res.json({
    isSuccess: true,
    status: "Success",
    message: "Category updated successfully",
    category: result,
  });
};

const deleteCategoryHandler = async (req, res) => {
  await deleteCategory(req.params.id);

  res.json({
    isSuccess: true,
    status: "Success",
    message: "Category deleted successfully",
  });
};

module.exports = [
  route.post("/categories", createCategoryHandler),
  route.get("/categories", getAllCategoriesHandler, { isPublic: true }),
  route.put("/categories/:id", updateCategoryHandler),
  route.delete("/categories/:id", deleteCategoryHandler),
];
