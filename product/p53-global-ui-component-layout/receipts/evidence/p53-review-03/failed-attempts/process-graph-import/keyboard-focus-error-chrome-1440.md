# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual\smoke.spec.ts >> P53 视觉回归底座连通性 >> 键盘 Tab 可达登录表单首个输入框（键盘路径，方向 §4.6）
- Location: e2e\visual\smoke.spec.ts:40:3

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  locator('input[autocomplete="username"]')
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" locator('input[autocomplete="username"]') with timeout 5000ms
  - waiting for locator('input[autocomplete="username"]')
    13 × locator resolved to <input type="text" required="" data-v-67e64f9f="" autocomplete="username"/>
       - unexpected value "inactive"

```

```yaml
- textbox "Username"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | /**
  4  |  * P53 阶段 A/B 连通性冒烟：验证 Playwright 底座可启动 dev:mock 并到达真实路由。
  5  |  * 不落截图基线——视觉基线在阶段 B 全部入口页改造完成后统一建立，
  6  |  * 避免对中间视觉消耗方向 §4.7 允许的唯一一次基线校准。
  7  |  */
  8  | 
  9  | test.describe('P53 视觉回归底座连通性', () => {
  10 |   test('登录页可达且品牌分栏与表单结构在（节点 06）', async ({ page }) => {
  11 |     await page.goto('/login')
  12 |     await expect(page).toHaveTitle(/CH-aPaaS/)
  13 |     await expect(page.locator('section.login-page__brand strong')).toHaveText('CH-aPaaS')
  14 |     await expect(page.locator('form.login-page__form')).toBeVisible()
  15 |     await expect(page.locator('form.login-page__form button[type="submit"]')).toBeVisible()
  16 |   })
  17 | 
  18 |   test('375 视口登录页隐藏品牌区、表单可用（方向 §4.5）', async ({ page: mobile }) => {
  19 |     await mobile.setViewportSize({ width: 375, height: 812 })
  20 |     await mobile.goto('/login')
  21 |     await expect(mobile.locator('section.login-page__brand')).toBeHidden()
  22 |     await expect(mobile.locator('form.login-page__form button[type="submit"]')).toBeVisible()
  23 |   })
  24 | 
  25 |   test('未登录访问未知路由被守卫收敛（未认证→登录页；mock refresh 成功→动态 404）', async ({
  26 |     page,
  27 |   }) => {
  28 |     await page.goto('/definitely-not-a-route')
  29 |     // 两种合法守卫落点：refresh 失败→/login；mock refresh 成功→catchall 404。
  30 |     await expect(page).toHaveURL(/\/(login|404)/)
  31 |   })
  32 | 
  33 |   test('en-US 语言下登录页渲染英文（双语跟随，方向 §4.6）', async ({ page }) => {
  34 |     await page.addInitScript(() => window.localStorage.setItem('sw.locale', 'en-US'))
  35 |     await page.goto('/login')
  36 |     await expect(page.locator('.login-page__welcome')).toHaveText('Welcome back')
  37 |     await expect(page.locator('button[type="submit"]')).toHaveText(/Sign in/)
  38 |   })
  39 | 
  40 |   test('键盘 Tab 可达登录表单首个输入框（键盘路径，方向 §4.6）', async ({ page }) => {
  41 |     await page.goto('/login')
  42 |     await page.keyboard.press('Tab')
  43 |     await page.keyboard.press('Tab')
> 44 |     await expect(page.locator('input[autocomplete="username"]')).toBeFocused()
     |                                                                  ^ Error: expect(locator).toBeFocused() failed
  45 |   })
  46 | })
  47 | 
```