import { createTestDb } from '../db/testDb';
import * as categoriesService from './categoriesService';
import { createCategory, clearAllTestData } from './testUtils';

let db;

beforeEach(() => {
  db = createTestDb();
});

afterEach(async () => {
  await clearAllTestData(db);
});

describe('categoriesService', () => {
  it('should create a new category', async () => {
    const [created] = await categoriesService.createCategory({ 
      name: 'Test Category', 
      description: 'Test Description',
      icon: 'TestIcon'
    }, db);
    expect(created).toHaveProperty('id');
    expect(created.name).toBe('Test Category');
    expect(created.description).toBe('Test Description');
    expect(created.icon).toBe('TestIcon');
  });

  it('should get all categories', async () => {
    await categoriesService.createCategory({ name: 'Test Category' }, db);
    const all = await categoriesService.getAllCategories(db);
    expect(Array.isArray(all)).toBe(true);
    expect(all.some(c => c.name === 'Test Category')).toBe(true);
  });

  it('should get a category by id', async () => {
    const [created] = await categoriesService.createCategory({ name: 'Test Category' }, db);
    const category = await categoriesService.getCategoryById(created.id, db);
    expect(category).toBeTruthy();
    expect(category.name).toBe('Test Category');
  });

  it('should get categories with statistics', async () => {
    await categoriesService.createCategory({ name: 'Test Category' }, db);
    const all = await categoriesService.getCategoriesWithStatistics(db);
    expect(Array.isArray(all)).toBe(true);
    expect(all.some(c => c.name === 'Test Category')).toBe(true);
  });

  it('should update a category', async () => {
    const [created] = await categoriesService.createCategory({ name: 'Test Category' }, db);
    const [updated] = await categoriesService.updateCategory(created.id, { name: 'Updated Category' }, db);
    expect(updated.name).toBe('Updated Category');
  });

  it('should delete a category', async () => {
    const [created] = await categoriesService.createCategory({ name: 'Test Category' }, db);
    const [deleted] = await categoriesService.deleteCategory(created.id, db);
    expect(deleted.name).toBe('Test Category');
    const after = await categoriesService.getCategoryById(created.id, db);
    expect(after).toBeNull();
  });
}); 