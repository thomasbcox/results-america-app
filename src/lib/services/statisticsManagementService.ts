import { db } from '../db';
import { statistics } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ValidationError, NotFoundError } from '../errors';

export interface UpdateStatisticData {
  dataQuality?: 'mock' | 'real';
  provenance?: string;
  name?: string;
  description?: string;
  unit?: string;
  isActive?: boolean;
}

export class StatisticsManagementService {
  static async updateStatistic(id: number, data: UpdateStatisticData) {
    // Validate data quality
    if (data.dataQuality && !['mock', 'real'].includes(data.dataQuality)) {
      throw new ValidationError('Data quality must be either "mock" or "real"');
    }

    // Update the statistic
    const [updatedStatistic] = await db.update(statistics)
      .set({
        ...(data.dataQuality && { dataQuality: data.dataQuality }),
        ...(data.provenance !== undefined && { provenance: data.provenance }),
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.unit && { unit: data.unit }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      })
      .where(eq(statistics.id, id))
      .returning();

    if (!updatedStatistic) {
      throw new NotFoundError('Statistic not found');
    }

    return updatedStatistic;
  }

  static async getStatistic(id: number) {
    const [statistic] = await db.select().from(statistics)
      .where(eq(statistics.id, id))
      .limit(1);

    if (!statistic) {
      throw new NotFoundError('Statistic not found');
    }

    return statistic;
  }
} 