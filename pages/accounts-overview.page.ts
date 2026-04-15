import { expect } from '@playwright/test'
import { BasePage } from './base.page.js'

export class AccountsOverviewPage extends BasePage {
  async gotoAccountsOverview(): Promise<void> {
    await this.goto('/overview.htm')
  }

  async expectOnOverview(): Promise<void> {
    await this.expectUrlContains('overview')
    await expect(await this.smartLocate('accounts overview title')).toBeVisible()
  }

  async verifyGlobalNavigationMenu(): Promise<void> {
    const navHints = [
      'open new account link',
      'accounts overview link',
      'transfer funds link',
      'bill pay link',
      'find transactions link',
      'update contact info link',
      'request loan link',
      'log out link',
    ]

    for (const hint of navHints) {
      await expect(await this.smartLocate(hint)).toBeVisible()
    }
  }

  async expectAccountBalanceVisible(accountNumber: string): Promise<void> {
    await expect(this.page.locator(`a:has-text("${accountNumber}")`)).toBeVisible()
    const row = this.page.locator('tr', { has: this.page.locator(`a:has-text("${accountNumber}")`) }).first()
    await expect(row).toBeVisible()
    await expect(row.locator('td').nth(1)).toContainText(/\$|\d+/)
  }

  async getAlternateAccountNumber(excludeAccount: string): Promise<string> {
    const accountLinks = this.page.locator('a[href*="activity.htm?id="]')
    const total = await accountLinks.count()
    for (let i = 0; i < total; i += 1) {
      const value = ((await accountLinks.nth(i).textContent()) ?? '').trim()
      if (value && value !== excludeAccount) {
        return value
      }
    }

    return excludeAccount
  }
}
