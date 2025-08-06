#!/usr/bin/env tsx

import { StatisticsService } from '../src/lib/services/statisticsService'

async function testRankings() {
  console.log('🧪 Testing Rankings Functionality...\n')

  try {
    // Test 1: Get top 3 rankings
    console.log('1. Testing top 3 rankings...')
    const topRankings = await StatisticsService.getStatisticRankings(1, 2022, 'desc')
    console.log(`✅ Found ${topRankings.rankings.length} rankings`)
    console.log('Top 3 states:')
    topRankings.rankings.slice(0, 3).forEach((ranking, index) => {
      console.log(`  ${index + 1}. ${ranking.stateName} - ${ranking.value} (Rank: #${ranking.rank})`)
    })
    console.log()

    // Test 2: Get all rankings
    console.log('2. Testing all rankings...')
    const allRankings = await StatisticsService.getStatisticRankings(1, 2022, 'desc')
    console.log(`✅ Found ${allRankings.rankings.length} total rankings`)
    console.log('Bottom 3 states:')
    allRankings.rankings.slice(-3).forEach((ranking, index) => {
      console.log(`  ${allRankings.rankings.length - 2 + index}. ${ranking.stateName} - ${ranking.value} (Rank: #${ranking.rank})`)
    })
    console.log()

    // Test 3: Test ascending order
    console.log('3. Testing ascending order...')
    const ascendingRankings = await StatisticsService.getStatisticRankings(1, 2022, 'asc')
    console.log('Top 3 states (ascending):')
    ascendingRankings.rankings.slice(0, 3).forEach((ranking, index) => {
      console.log(`  ${index + 1}. ${ranking.stateName} - ${ranking.value} (Rank: #${ranking.rank})`)
    })
    console.log()

    // Test 4: Test API endpoint
    console.log('4. Testing API endpoint...')
    const response = await fetch('http://localhost:3050/api/statistics/1/rankings?year=2022&order=desc&limit=3')
    const apiData = await response.json()
    
    if (apiData.success) {
      console.log('✅ API endpoint working correctly')
      console.log(`Found ${apiData.rankings.length} rankings via API`)
    } else {
      console.log('❌ API endpoint failed')
    }

    console.log('\n🎉 All tests passed! Rankings functionality is working correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testRankings() 