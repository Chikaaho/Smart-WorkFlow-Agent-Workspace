import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 配置治理检查：仅读取工程配置和目录清单，不读取业务源码。
const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const web = join(workspace, 'Smart-WorkFlow-aPaaS-Web')
// 与在前端仓库执行 ESLint 保持相同的 resolver/basePath 工作目录。
process.chdir(web)
const requireWeb = createRequire(join(web, 'package.json'))
const { ESLint } = requireWeb('eslint')
const importPlugin = requireWeb('eslint-plugin-import')
const modulesRoot = join(web, 'src/modules')
const modules = readdirSync(modulesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

const eslint = new ESLint({ cwd: web })
const effective = await eslint.calculateConfigForFile(join(modulesRoot, 'form/__governance_probe__.ts'))
const rule = effective.rules['import/no-restricted-paths']
assert.equal(rule[0], 2, '模块边界必须为 error')
assert.deepEqual(
  rule[1].zones.map((zone) => zone.target.split('/')[3]).sort(),
  modules,
  'ESLint 模块清单必须覆盖当前实际模块且无失效目录',
)

// 只执行实际配置中的路径边界规则；解析探针文本，不运行项目测试或业务代码。
const boundary = new ESLint({
  cwd: web,
  overrideConfigFile: true,
  overrideConfig: {
    files: ['**/*.ts'],
    plugins: { import: importPlugin },
    settings: effective.settings,
    rules: { 'import/no-restricted-paths': rule },
  },
})
function firstTarget(directory) {
  const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of entries) {
    if (entry.isFile() && /\.(ts|vue)$/.test(entry.name) && !entry.name.endsWith('.spec.ts') && !entry.name.endsWith('.d.ts')) {
      return join(directory, entry.name)
    }
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const target = firstTarget(join(directory, entry.name))
      if (target) return target
    }
  }
}
const targets = new Map(modules.map((name) => [name, firstTarget(join(modulesRoot, name))]))
let checks = 0
for (const from of modules) {
  for (const to of modules) {
    const target = targets.get(to)
    assert.ok(target, `${to}: 缺少可解析的模块路径`)
    const specifier = '@/' + relative(join(web, 'src'), target).replaceAll('\\', '/').replace(/\.ts$/, '')
    const [result] = await boundary.lintText(`import '${specifier}'\n`, {
      filePath: join(modulesRoot, from, '__governance_probe__.ts'),
    })
    assert.ok(!result.messages.some((message) => message.fatal || message.ruleId !== 'import/no-restricted-paths'),
      `${from}→${to}: 意外诊断 ${JSON.stringify(result.messages)}`)
    assert.equal(result.errorCount, from === to ? 0 : 1,
      `${from}→${to}: 同模块应允许，跨模块应拒绝`)
    checks += 1
  }
}
console.log(`module-boundary checks=${checks} modules=${modules.length} passed=${checks}`)
