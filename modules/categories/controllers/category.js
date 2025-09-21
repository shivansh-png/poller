const knex = require("@lib/knex");
const errors = require("@lib/errors");

const createCategory = async (categoryData) => {
  const { name, description } = categoryData;

  // Check if category already exists
  const existingCategory = await knex("poll_categories")
    .where({ name })
    .first();
  if (existingCategory) {
    throw errors.VALIDATION_ERROR("Category with this name already exists");
  }

  const [category] = await knex("poll_categories")
    .insert({ name, description })
    .returning("*");

  return category;
};

const getAllCategories = async () => {
  const categories = await knex("poll_categories").select("*").orderBy("name");

  // Get poll count for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const [{ count }] = await knex("polls")
        .where("categoryId", category.id)
        .count("id as count");

      return {
        ...category,
        pollCount: parseInt(count),
      };
    })
  );

  return categoriesWithCounts;
};

const updateCategory = async (categoryId, updateData) => {
  const category = await knex("poll_categories")
    .where("id", categoryId)
    .first();

  if (!category) {
    throw errors.NOT_FOUND("Category not found");
  }

  // Check for duplicate name if updating name
  if (updateData.name && updateData.name !== category.name) {
    const existingCategory = await knex("poll_categories")
      .where({ name: updateData.name })
      .first();

    if (existingCategory) {
      throw errors.VALIDATION_ERROR("Category with this name already exists");
    }
  }

  const [updatedCategory] = await knex("poll_categories")
    .where("id", categoryId)
    .update(updateData)
    .returning("*");

  return updatedCategory;
};

const deleteCategory = async (categoryId) => {
  const category = await knex("poll_categories")
    .where("id", categoryId)
    .first();

  if (!category) {
    throw errors.NOT_FOUND("Category not found");
  }

  // Check if category is being used
  const [{ count }] = await knex("polls")
    .where("categoryId", categoryId)
    .count("id as count");

  if (parseInt(count) > 0) {
    throw errors.VALIDATION_ERROR(
      "Cannot delete category that is being used by polls"
    );
  }

  await knex("poll_categories").where("id", categoryId).del();
};

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
