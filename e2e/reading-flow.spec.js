// @ts-check
const { test, expect } = require('@playwright/test')

test.describe('Sweety Blood Glucose Tracker - Core User Journey', () => {
  test('Complete flow: login -> add reading -> view report -> edit reading -> delete via ConfirmModal', async ({ page }) => {
    // 1. Visit Sweety Login
    await page.goto('/login')
    await expect(page).toHaveTitle(/Sweety/i)

    // Fill demo credentials
    await page.fill('#email', 'demo@sweety.app')
    await page.fill('#password', 'Demo1234!')
    await page.click('button[type="submit"]')

    // 2. Redirect to dashboard / logbook
    await expect(page).toHaveURL(/\/(readings)?$/)
    await expect(page.locator('text=Sweety')).toBeVisible()

    // 3. Add a new reading
    const testDate = '2026-05-18'
    const testValue = '132'

    // Open add modal or fill reading form
    const addBtn = page.locator('button:has-text("Add Reading")').first()
    if (await addBtn.isVisible()) {
      await addBtn.click()
    }

    await page.fill('#reading_date', testDate)
    await page.selectOption('#time_slot', 'after_breakfast')
    await page.fill('#value_mgdl', testValue)
    await page.click('button:has-text("Save Reading")')

    // Toast confirmation
    await expect(page.locator('.toast-success, [role="status"]')).toBeVisible()

    // 4. View in Daily Report
    await page.goto(`/reports?tab=daily&date=${testDate}`)
    await expect(page.locator(`text=${testValue} mg/dl`)).toBeVisible()
    await expect(page.locator('text=After breakfast')).toBeVisible()

    // 5. Navigate back to Logbook and Edit Reading
    await page.goto('/readings')
    const editBtn = page.locator(`button[aria-label*="Edit"], button:has-text("Edit")`).first()
    await editBtn.click()

    await page.fill('#value_mgdl', '145')
    await page.click('button:has-text("Update Reading"), button:has-text("Save")')
    await expect(page.locator('.toast-success, [role="status"]')).toBeVisible()

    // 6. Delete via ConfirmModal
    const deleteBtn = page.locator(`button[aria-label*="Delete"], button:has-text("Delete")`).first()
    await deleteBtn.click()

    // Modal dialog is displayed
    const modal = page.locator('[role="dialog"][aria-modal="true"]')
    await expect(modal).toBeVisible()
    await expect(modal.locator('text=Delete')).toBeVisible()

    // Confirm deletion
    await modal.locator('button:has-text("Delete")').click()
    await expect(page.locator('.toast-success, [role="status"]')).toBeVisible()
  })
})
