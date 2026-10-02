import { test, expect } from '@playwright/test'

test.describe('Ficha de tienda', () => {
  test('navega a /tienda/ferreza y pinta el hero del nodo', async ({ page }) => {
    await page.goto('/tienda/ferreza')

    await expect(page).toHaveURL(/\/tienda\/ferreza$/)
    await expect(page.locator('.store-hero__title')).toContainText('Ferreza')
    await expect(page.locator('.store-hero__eyebrow')).toContainText('Nodo 06 / 22')
    await expect(page.locator('.store-hero__lead')).toHaveText(
      'Herramienta que no falla'
    )
  })

  test('muestra el badge con el subdominio del nodo', async ({ page }) => {
    await page.goto('/tienda/ferreza')

    await expect(page.locator('.domain-badge')).toContainText(
      'ferreza.presentto.online'
    )
    await expect(page.locator('.store-hero__actions a').nth(1)).toHaveText(
      'ferreza.presentto.online'
    )
  })

  test('lista el catálogo del nodo con su producto estrella', async ({ page }) => {
    await page.goto('/tienda/ferreza')

    await expect(page.getByText('Taladro percutor 750 W')).toBeVisible()
    await expect(page.locator('.product')).toHaveCount(2)
    await expect(page.locator('.store-hero__back')).toHaveText('← Índice general')
  })
})
