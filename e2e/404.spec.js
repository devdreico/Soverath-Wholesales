import { test, expect } from '@playwright/test'

test.describe('Rutas fuera de cobertura', () => {
  test('una ruta inválida muestra el 404', async ({ page }) => {
    await page.goto('/cualquiera')

    await expect(
      page.getByRole('heading', { name: 'Nodo fuera de cobertura' })
    ).toBeVisible()
    await expect(page.getByText('error 404')).toBeVisible()
  })

  test('una tienda inexistente muestra el 404', async ({ page }) => {
    await page.goto('/tienda/inexistente')

    await expect(
      page.getByRole('heading', { name: 'Nodo fuera de cobertura' })
    ).toBeVisible()
  })

  test('el 404 enlaza de vuelta al índice y al catálogo', async ({ page }) => {
    await page.goto('/ruta/que/no/existe')

    await expect(page.getByRole('link', { name: /Volver al índice/ })).toHaveAttribute(
      'href',
      '/'
    )
    await expect(page.getByRole('link', { name: '/productos' })).toHaveAttribute(
      'href',
      '/productos'
    )
  })
})
