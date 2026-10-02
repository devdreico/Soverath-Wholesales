import { test, expect } from '@playwright/test'

test.describe('Portada', () => {
  test('muestra el título de la página', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(
      'Soverath Wholesales | Importador de productos y bodegas'
    )
  })

  test('lista las 22 tarjetas del directorio de tiendas', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.stores__cell')).toHaveCount(22)
    await expect(page.locator('.card')).toHaveCount(22)
    await expect(page.locator('.card__name').first()).toBeVisible()
  })

  test('el CTA principal lleva a la sala de productos', async ({ page }) => {
    await page.goto('/')

    const cta = page.getByRole('link', { name: /Entrar a la sala de productos/ })
    await expect(cta).toHaveAttribute('href', '/productos')
    await cta.click()

    await expect(page).toHaveURL(/\/productos$/)
    await expect(page.getByRole('heading', { name: 'Catálogo de mayoreo' })).toBeVisible()
  })
})
