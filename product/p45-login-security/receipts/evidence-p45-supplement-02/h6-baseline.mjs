// H6：从当前工作树机械读取 git/迁移/测试基线信息；不读取或输出敏感环境变量。
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2]
if (!root) throw new Error('usage: node h6-baseline.mjs <repository>')
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
const migrations = []
const walk = (dir, depth = 0) => {
  if (depth > 12) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'target' && entry.name !== 'node_modules') walk(path, depth + 1)
    if (entry.isFile() && /^V\d+__.*\.sql$/.test(entry.name)) migrations.push(path.slice(root.length + 1))
  }
}
walk(root)
const selectedMigrations = migrations.filter((path) => /(?:^|\/)V(?:44|45|46)__/.test(path)).sort()
console.log(JSON.stringify({ branch: git('branch', '--show-current'), head: git('rev-parse', 'HEAD'), status: git('status', '--short').split('\n').filter(Boolean).map((line) => line.slice(0, 2) + ' <path>'), diffStat: git('diff', '--stat'), migrationCount: migrations.length, migrationVersions: [...new Set(migrations.map((path) => path.match(/(?:^|\/)V(\d+)__/)[1]))].sort((a, b) => Number(a) - Number(b)), selectedMigrations }))
