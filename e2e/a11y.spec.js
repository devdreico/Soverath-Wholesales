import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PAGINAS = ['/', '/productos', '/tienda/botane']

for (const path of PAGINAS) {
  test.describe(`accibilidad ${path}`, () => {
    test('sin violaciones serious ni critical', async ({ page }) => {
      await page.goto(path)

      const results = await new AxeBuilder({ page }).analyze()
      const graves = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical'
      )

      expect(
        graves.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          ayuda: violation.help,
          nodos: violation.nodes.length,
        })),
        `violaciones graves en ${path}`
      ).toEqual([])
    })
  })
}
