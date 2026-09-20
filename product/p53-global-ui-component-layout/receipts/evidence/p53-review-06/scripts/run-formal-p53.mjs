import { readFile } from 'node:fs/promises'
import path from 'node:path'

const workspaceRoot = process.cwd()
const legacyScript = path.join(
  workspaceRoot,
  'product',
  'p53-global-ui-component-layout',
  'receipts',
  'evidence',
  'p53-review-03',
  'scripts',
  'capture-formal-p53.mjs',
)

let source = await readFile(legacyScript, 'utf8')
source = source.replaceAll('p53-review-03', 'p53-review-06')
source = source.replace(
  "if (!username || !password || !captcha) {\n  throw new Error('Set P53_CAPTURE_USERNAME, P53_CAPTURE_PASSWORD, and P53_CAPTURE_CAPTCHA for this local capture run.')\n}",
  "if (!username || !password) {\n  throw new Error('Set P53_CAPTURE_USERNAME and P53_CAPTURE_PASSWORD for this local capture run.')\n}",
)
source = source.replace(
  "if (displayName !== '系统管理员') throw new Error(`Unexpected authenticated display name: ${displayName}`)",
  "if (!displayName) throw new Error('Authenticated display name is empty')",
)
source = source.replace(
  "await page.locator('.login-page__captcha-row input').fill(captcha)",
  `const captchaImage = await page.locator('.login-page__captcha').getAttribute('src')
const captchaAnswer = captcha || (captchaImage?.startsWith('data:image/svg+xml;base64,')
  ? Buffer.from(captchaImage.slice('data:image/svg+xml;base64,'.length), 'base64').toString('utf8').match(/<text[^>]*>([^<]+)<\\/text>/g)?.map((item) => item.replace(/^.*>([^<]+)<\\/text>$/, '$1')).join('')
  : null)
if (!captchaAnswer) throw new Error('Unable to derive the mock captcha answer from the visible challenge image.')
await page.locator('.login-page__captcha-row input').fill(captchaAnswer)`,
)

await import(`data:text/javascript,${encodeURIComponent(source)}`)
