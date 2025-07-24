import { NextRequest, NextResponse } from 'next/server';
import { ExternalDataService } from '@/lib/services/externalDataService';
import { AuthService } from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const sessionToken = request.cookies.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await AuthService.getUserFromSession(sessionToken);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { source, action } = body;

    if (!source || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters: source and action' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'import':
        switch (source) {
          case 'BEA_GDP':
            result = await ExternalDataService.importBEAGDPData();
            break;
          case 'BLS_EMPLOYMENT':
            result = await ExternalDataService.importBLSEmploymentData();
            break;
          case 'CENSUS_POPULATION':
            result = await ExternalDataService.importCensusPopulationData();
            break;
          default:
            return NextResponse.json(
              { error: `Unknown data source: ${source}` },
              { status: 400 }
            );
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Import job started successfully`,
      job: result
    });

  } catch (error) {
    console.error('Error in external data import:', error);
    return NextResponse.json(
      { error: 'Failed to process external data import request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const sessionToken = request.cookies.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await AuthService.getUserFromSession(sessionToken);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'sources') {
      // Return available data sources
      return NextResponse.json({
        sources: [
          {
            id: 'BEA_GDP',
            name: 'Bureau of Economic Analysis - GDP',
            description: 'Gross Domestic Product by State (7 years: 2017-2023)',
            url: 'https://www.bea.gov/data/gdp/gdp-state',
            dataFormat: 'JSON',
            rateLimit: '60 requests/minute',
            estimatedRecords: '343 (49 states × 7 years)'
          },
          {
            id: 'BLS_EMPLOYMENT',
            name: 'Bureau of Labor Statistics - Employment',
            description: 'Total Employment by State (7 years: 2017-2023)',
            url: 'https://www.bls.gov/data/',
            dataFormat: 'JSON',
            rateLimit: '25 requests/minute',
            estimatedRecords: '343 (49 states × 7 years)'
          },
          {
            id: 'CENSUS_POPULATION',
            name: 'US Census Bureau - Population',
            description: 'Population Estimates by State (7 years: 2017-2023)',
            url: 'https://www.census.gov/data/developers/data-sets/popest-popproj.html',
            dataFormat: 'JSON',
            rateLimit: '500 requests/minute',
            estimatedRecords: '343 (49 states × 7 years)'
          }
        ]
      });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fetching external data sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch external data sources' },
      { status: 500 }
    );
  }
} 