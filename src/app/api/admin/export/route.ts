import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { dataPoints, states, statistics, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    // Fetch all data points with related data
    const allDataPoints = await db.select({
      id: dataPoints.id,
      year: dataPoints.year,
      value: dataPoints.value,
      stateName: states.name,
      stateAbbreviation: states.abbreviation,
      statisticName: statistics.name,
      statisticNumber: statistics.raNumber,
      categoryName: categories.name,
      description: statistics.description,
      unit: statistics.unit
    })
    .from(dataPoints)
    .leftJoin(states, eq(dataPoints.stateId, states.id))
    .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
    .leftJoin(categories, eq(statistics.categoryId, categories.id));

    // Convert to CSV format
    const csvHeaders = [
      'ID',
      'Year',
      'Value',
      'State',
      'State Abbreviation',
      'Statistic Name',
      'RA Number',
      'Category',
      'Description',
      'Unit'
    ];

    const csvRows = allDataPoints.map(point => [
      point.id,
      point.year,
      point.value,
      point.stateName,
      point.stateAbbreviation,
      point.statisticName,
      point.statisticNumber,
      point.categoryName,
      point.description,
      point.unit
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field || ''}"`).join(','))
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="results-america-data-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
} 