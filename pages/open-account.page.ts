import { expect } from '@playwright/test'
import { BasePage } from './base.page.js'

export class OpenAccountPage extends BasePage {
  async openNewAccount(accountType: string): Promise<void> {
    await this.goto('/openaccount.htm')
    await this.page.locator('#fromAccountId option').first().waitFor({ state: 'attached', timeout: 15_000 })
    await (await this.smartLocate('account type dropdown')).selectOption({ label: accountType })
    await (await this.smartLocate('open new account button')).click()
    await this.page.locator('#openAccountResult').waitFor({ state: 'visible', timeout: 20_000 })
  }

  async getNewAccountNumber(): Promise<string> {
    const accountLink = await this.smartLocate('new account number link')
    const raw = (await accountLink.first().textContent()) ?? ''
    return raw.trim()
  }

  async expectAccountOpened(): Promise<void> {
    await expect(await this.smartLocate('account opened message')).toBeVisible()
    await expect(await this.smartLocate('new account number link')).toBeVisible()
  }
}
