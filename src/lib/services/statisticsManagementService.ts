import { getDbOrThrow } from '../db';
import { statistics } from '../db/schema-postgres';
import { eq } from 'drizzle-orm';
import { ValidationError, NotFoundError } from '../errors';
import type { IStatisticsManagementService, UpdateStatisticData, StatisticData } from '../types/service-interfaces';

export class StatisticsManagementService {
  static async updateStatistic(id: number, data: UpdateStatisticData): Promise<StatisticData> {
    const db = getDbOrThrow();
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
        ...(data.preferenceDirection && { preferenceDirection: data.preferenceDirection }),
        ...(data.isActive !== undefined && { isActive: data.isActive ? 1 : 0 })
      })
      .where(eq(statistics.id, id))
      .returning();

    if (!updatedStatistic) {
      throw new NotFoundError('Statistic not found');
    }

    return {
      id: updatedStatistic.id,
      name: updatedStatistic.name,
      raNumber: updatedStatistic.raNumber,
      description: updatedStatistic.description,
      subMeasure: updatedStatistic.subMeasure,
      calculation: updatedStatistic.calculation,
      unit: updatedStatistic.unit,
      availableSince: updatedStatistic.availableSince,
      preferenceDirection: updatedStatistic.preferenceDirection || 'higher',
      dataQuality: updatedStatistic.dataQuality || 'mock',
      provenance: updatedStatistic.provenance,
      isActive: updatedStatistic.isActive ?? 1,
      categoryId: updatedStatistic.categoryId,
      dataSourceId: updatedStatistic.dataSourceId,
    };
  }

  static async getStatistic(id: number): Promise<StatisticData> {
    const db = getDbOrThrow();
    const [statistic] = await db.select({
      id: statistics.id,
      name: statistics.name,
      raNumber: statistics.raNumber,
      description: statistics.description,
      subMeasure: statistics.subMeasure,
      calculation: statistics.calculation,
      unit: statistics.unit,
      availableSince: statistics.availableSince,
      preferenceDirection: statistics.preferenceDirection,
      dataQuality: statistics.dataQuality,
      provenance: statistics.provenance,
      isActive: statistics.isActive,
      categoryId: statistics.categoryId,
      dataSourceId: statistics.dataSourceId,
    }).from(statistics)
      .where(eq(statistics.id, id))
      .limit(1);

    if (!statistic) {
      throw new NotFoundError('Statistic not found');
    }

    return {
      id: statistic.id,
      name: statistic.name,
      raNumber: statistic.raNumber,
      description: statistic.description,
      subMeasure: statistic.subMeasure,
      calculation: statistic.calculation,
      unit: statistic.unit,
      availableSince: statistic.availableSince,
      preferenceDirection: statistic.preferenceDirection || 'higher',
      dataQuality: statistic.dataQuality || 'mock',
      provenance: statistic.provenance,
      isActive: statistic.isActive ?? 1,
      categoryId: statistic.categoryId,
      dataSourceId: statistic.dataSourceId,
    };
  }
} 