import { expect } from '@playwright/test'
import { BasePage } from './base.page.js'

export class TransferFundsPage extends BasePage {
  async transfer(amount: string): Promise<void> {
    await this.goto('/transfer.htm')
    await this.page.locator('#fromAccountId option').first().waitFor({ state: 'attached', timeout: 15_000 })
    await (await this.smartLocate('transfer amount input')).fill(amount)
    await (await this.smartLocate('transfer submit button')).click()
    await this.page.locator('#showResult').waitFor({ state: 'visible', timeout: 20_000 })
  }

  async expectTransferConfirmation(): Promise<void> {
    await expect(await this.smartLocate('transfer confirmation message')).toBeVisible()
  }

  async transferBetweenAccounts(amount: string, fromAccount: string, toAccount: string): Promise<void> {
    await this.goto('/transfer.htm')
    await this.page.locator('#fromAccountId option').first().waitFor({ state: 'attached', timeout: 15_000 })
    await (await this.smartLocate('transfer amount input')).fill(amount)
    await (await this.smartLocate('transfer from account dropdown')).selectOption(fromAccount)
    await (await this.smartLocate('transfer to account dropdown')).selectOption(toAccount)
    await (await this.smartLocate('transfer submit button')).click()
    await this.page.locator('#showResult').waitFor({ state: 'visible', timeout: 20_000 })
  }
}
