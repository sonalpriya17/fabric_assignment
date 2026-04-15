import { expect } from '@playwright/test'
import { BasePage } from './base.page.js'

export type BillPaymentForm = {
  payeeName: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  account: string
  verifyAccount: string
  amount: string
}

export class BillPaymentPage extends BasePage {
  async gotoBillPay(): Promise<void> {
    await this.goto('/billpay.htm')
  }

  async payBill(form: BillPaymentForm): Promise<void> {
    await (await this.smartLocate('payee name input')).fill(form.payeeName)
    await (await this.smartLocate('bill address input')).fill(form.address)
    await (await this.smartLocate('bill city input')).fill(form.city)
    await (await this.smartLocate('bill state input')).fill(form.state)
    await (await this.smartLocate('bill zip input')).fill(form.zipCode)
    await (await this.smartLocate('bill phone input')).fill(form.phone)
    await (await this.smartLocate('bill account input')).fill(form.account)
    await (await this.smartLocate('bill verify account input')).fill(form.verifyAccount)
    await (await this.smartLocate('bill amount input')).fill(form.amount)
    await (await this.smartLocate('send payment button')).click()
    await this.page.locator('#billpayResult').waitFor({ state: 'visible', timeout: 20_000 })
  }

  async expectBillPaymentComplete(): Promise<void> {
    await expect(await this.smartLocate('bill payment complete message')).toBeVisible()
  }

  async selectFromAccount(accountNumber: string): Promise<void> {
    await (await this.smartLocate('bill pay from account dropdown')).selectOption(accountNumber)
  }

  async payBillFromAccount(form: BillPaymentForm, accountNumber: string): Promise<void> {
    await this.gotoBillPay()
    await this.selectFromAccount(accountNumber)
    await this.payBill(form)
  }

  async expectPaymentSummaryIncludes(amount: string): Promise<void> {
    await expect(await this.smartLocate('bill payment amount value')).toContainText(amount)
  }
}
