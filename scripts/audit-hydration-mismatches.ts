#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'

interface HydrationIssue {
  file: string
  line: number
  code: string
  issue: string
  severity: 'high' | 'medium' | 'low'
}

const issues: HydrationIssue[] = []

// Patterns that commonly cause hydration mismatches
const problematicPatterns = [
  {
    pattern: /useSelection\(\)/,
    issue: 'Context hook used - may cause hydration mismatch if values differ between server/client',
    severity: 'high' as const
  },
  {
    pattern: /selectedStates\.length/,
    issue: 'Context array length used in JSX - server/client may have different values',
    severity: 'high' as const
  },
  {
    pattern: /selectedCategory/,
    issue: 'Context value used in JSX - server/client may have different values',
    severity: 'high' as const
  },
  {
    pattern: /selectedMeasure/,
    issue: 'Context value used in JSX - server/client may have different values',
    severity: 'high' as const
  },
  {
    pattern: /Date\.now\(\)/,
    issue: 'Dynamic timestamp used - will differ between server/client',
    severity: 'medium' as const
  },
  {
    pattern: /Math\.random\(\)/,
    issue: 'Random value used - will differ between server/client',
    severity: 'medium' as const
  },
  {
    pattern: /window\./,
    issue: 'Browser API used - not available during SSR',
    severity: 'high' as const
  },
  {
    pattern: /localStorage\./,
    issue: 'Browser storage used - not available during SSR',
    severity: 'high' as const
  },
  {
    pattern: /sessionStorage\./,
    issue: 'Browser storage used - not available during SSR',
    severity: 'high' as const
  },
  {
    pattern: /document\./,
    issue: 'DOM API used - not available during SSR',
    severity: 'high' as const
  }
]

function scanFile(filePath: string): HydrationIssue[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const fileIssues: HydrationIssue[] = []

  lines.forEach((line, index) => {
    problematicPatterns.forEach(({ pattern, issue, severity }) => {
      if (pattern.test(line)) {
        fileIssues.push({
          file: filePath,
          line: index + 1,
          code: line.trim(),
          issue,
          severity
        })
      }
    })
  })

  return fileIssues
}

function scanDirectory(dir: string): HydrationIssue[] {
  const allIssues: HydrationIssue[] = []

  function scanRecursive(currentDir: string) {
    const items = fs.readdirSync(currentDir)

    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        // Skip node_modules and other build directories
        if (!['node_modules', '.next', 'dist', 'build', 'coverage'].includes(item)) {
          scanRecursive(fullPath)
        }
      } else if (stat.isFile()) {
        // Only scan TypeScript/JavaScript files
        if (/\.(tsx?|jsx?)$/.test(item)) {
          const fileIssues = scanFile(fullPath)
          allIssues.push(...fileIssues)
        }
      }
    }
  }

  scanRecursive(dir)
  return allIssues
}

function generateReport(issues: HydrationIssue[]): string {
  const highIssues = issues.filter(i => i.severity === 'high')
  const mediumIssues = issues.filter(i => i.severity === 'medium')
  const lowIssues = issues.filter(i => i.severity === 'low')

  let report = `# Hydration Mismatch Audit Report\n\n`
  report += `Generated: ${new Date().toISOString()}\n\n`
  report += `## Summary\n`
  report += `- High Priority Issues: ${highIssues.length}\n`
  report += `- Medium Priority Issues: ${mediumIssues.length}\n`
  report += `- Low Priority Issues: ${lowIssues.length}\n`
  report += `- Total Issues: ${issues.length}\n\n`

  if (highIssues.length > 0) {
    report += `## 🔴 High Priority Issues\n\n`
    highIssues.forEach(issue => {
      report += `### ${path.relative(process.cwd(), issue.file)}:${issue.line}\n`
      report += `**Issue:** ${issue.issue}\n`
      report += `**Code:** \`${issue.code}\`\n\n`
    })
  }

  if (mediumIssues.length > 0) {
    report += `## 🟡 Medium Priority Issues\n\n`
    mediumIssues.forEach(issue => {
      report += `### ${path.relative(process.cwd(), issue.file)}:${issue.line}\n`
      report += `**Issue:** ${issue.issue}\n`
      report += `**Code:** \`${issue.code}\`\n\n`
    })
  }

  if (lowIssues.length > 0) {
    report += `## 🟢 Low Priority Issues\n\n`
    lowIssues.forEach(issue => {
      report += `### ${path.relative(process.cwd(), issue.file)}:${issue.line}\n`
      report += `**Issue:** ${issue.issue}\n`
      report += `**Code:** \`${issue.code}\`\n\n`
    })
  }

  report += `## Recommendations\n\n`
  report += `1. **Use ClientOnly wrapper** for components that depend on context values\n`
  report += `2. **Use useSafeContextValue hook** for accessing context values safely\n`
  report += `3. **Move browser-only code** into useEffect hooks\n`
  report += `4. **Add hydration tests** to catch issues early\n\n`

  return report
}

async function main() {
  console.log('🔍 Scanning for potential hydration mismatches...\n')

  const srcDir = path.join(process.cwd(), 'src')
  const issues = scanDirectory(srcDir)

  console.log(`Found ${issues.length} potential hydration issues:\n`)

  const highCount = issues.filter(i => i.severity === 'high').length
  const mediumCount = issues.filter(i => i.severity === 'medium').length
  const lowCount = issues.filter(i => i.severity === 'low').length

  console.log(`🔴 High Priority: ${highCount}`)
  console.log(`🟡 Medium Priority: ${mediumCount}`)
  console.log(`🟢 Low Priority: ${lowCount}\n`)

  if (highCount > 0) {
    console.log('🔴 HIGH PRIORITY ISSUES:')
    issues.filter(i => i.severity === 'high').forEach(issue => {
      console.log(`  ${path.relative(process.cwd(), issue.file)}:${issue.line}`)
      console.log(`    ${issue.issue}`)
      console.log(`    Code: ${issue.code}`)
      console.log('')
    })
  }

  // Generate detailed report
  const report = generateReport(issues)
  fs.writeFileSync('HYDRATION_AUDIT_REPORT.md', report)
  console.log('📄 Detailed report saved to: HYDRATION_AUDIT_REPORT.md')

  // Exit with error code if high priority issues found
  if (highCount > 0) {
    console.log('\n❌ High priority hydration issues found!')
    process.exit(1)
  } else {
    console.log('\n✅ No high priority hydration issues found.')
  }
}

main().catch(console.error) 