import { test, expect } from '@playwright/test'

test.describe('Sala de productos', () => {
  test('buscar "taladro" deja un único resultado', async ({ page }) => {
    await page.goto('/productos')

    await page.getByLabel('Buscar productos').fill('taladro')

    await expect(page.locator('.filters__count')).toHaveText('001 refs')
    await expect(page.locator('.product')).toHaveCount(1)
    await expect(page.getByText('Taladro percutor 750 W')).toBeVisible()
  })

  test('el chip Cocina filtra el catálogo a esa categoría', async ({ page }) => {
    await page.goto('/productos')

    await page.getByRole('button', { name: 'Cocina', exact: true }).click()

    await expect(page.locator('.filters__count')).toHaveText('002 refs')
    await expect(page.locator('.product')).toHaveCount(2)

    const categories = await page.locator('.product__category').allTextContents()
    expect(categories).toHaveLength(2)
    for (const category of categories) {
      expect(category).toBe('Cocina')
    }
    await expect(page.getByRole('button', { name: 'Cocina', exact: true })).toHaveClass(
      /is-active/
    )
  })

  test('una búsqueda sin resultados muestra el estado vacío', async ({ page }) => {
    await page.goto('/productos')

    await page.getByLabel('Buscar productos').fill('zzzzzz')

    await expect(page.locator('.filters__count')).toHaveText('000 refs')
    await expect(page.locator('.products-empty')).toBeVisible()
    await expect(page.locator('.product')).toHaveCount(0)
  })
})
