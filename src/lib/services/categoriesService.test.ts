import { CategoriesService } from './categoriesService';
import { db } from '../db/index';
import { categories } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('categoriesService', () => {
  it('should create a new category', async () => {
    const created = await CategoriesService.createCategory({ 
      name: 'Test Category', 
      description: 'Test Description',
      icon: 'TestIcon'
    });

    expect(created).toBeDefined();
    expect(created.name).toBe('Test Category');
    expect(created.description).toBe('Test Description');
    expect(created.icon).toBe('TestIcon');

    // Clean up
    await db.delete(categories).where(eq(categories.id, created.id));
  });

  it('should get all categories', async () => {
    await CategoriesService.createCategory({ name: 'Test Category' });
    const all = await CategoriesService.getAllCategories();
    expect(Array.isArray(all)).toBe(true);
    expect(all.some(c => c.name === 'Test Category')).toBe(true);

    // Clean up
    const testCategory = all.find(c => c.name === 'Test Category');
    if (testCategory) {
      await db.delete(categories).where(eq(categories.id, testCategory.id));
    }
  });

  it('should get a category by id', async () => {
    const created = await CategoriesService.createCategory({ name: 'Test Category' });
    const category = await CategoriesService.getCategoryById(created.id);
    expect(category).toBeTruthy();
    expect(category?.name).toBe('Test Category');

    // Clean up
    await db.delete(categories).where(eq(categories.id, created.id));
  });

  it('should get categories with statistics', async () => {
    await CategoriesService.createCategory({ name: 'Test Category' });
    const all = await CategoriesService.getCategoriesWithStatistics();
    expect(Array.isArray(all)).toBe(true);
    expect(all.some(c => c.name === 'Test Category')).toBe(true);

    // Clean up
    const testCategory = all.find(c => c.name === 'Test Category');
    if (testCategory) {
      await db.delete(categories).where(eq(categories.id, testCategory.id));
    }
  });

  it('should update a category', async () => {
    const created = await CategoriesService.createCategory({ name: 'Test Category' });
    const updated = await CategoriesService.updateCategory(created.id, { name: 'Updated Category' });
    expect(updated.name).toBe('Updated Category');

    // Clean up
    await db.delete(categories).where(eq(categories.id, created.id));
  });

  it('should delete a category', async () => {
    const created = await CategoriesService.createCategory({ name: 'Test Category' });
    const deleted = await CategoriesService.deleteCategory(created.id);
    expect(deleted).toBe(true);
    const after = await CategoriesService.getCategoryById(created.id);
    expect(after).toBeNull();
  });
}); 