import { test, expect } from '@playwright/test'

test.describe('Página de categoría', () => {
  test('prerenderiza título, canonical e h1 propios sin errores de hidratación', async ({
    page,
  }) => {
    const runtimeErrors = []
    page.on('pageerror', (error) => runtimeErrors.push(String(error)))
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text())
    })

    await page.goto('/productos/ferreteria')

    await expect(page).toHaveTitle('Ferretería — mayoreo | Soverath Wholesales')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://soverath.presentto.online/productos/ferreteria'
    )
    await expect(
      page.getByRole('heading', { level: 1, name: 'Mayoreo de Ferretería' })
    ).toBeVisible()
    await expect(page.locator('.product')).toHaveCount(2)

    await page.waitForLoadState('networkidle')

    const hydrationErrors = runtimeErrors.filter((text) =>
      /hydrat|did not match|server rendered HTML|Text content does not match/i.test(text)
    )
    expect(hydrationErrors).toEqual([])
  })
})
