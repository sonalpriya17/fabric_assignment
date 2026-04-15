import { expect } from '@playwright/test'
import { BasePage } from './base.page.js'

export type RegistrationForm = {
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  ssn: string
  username: string
  password: string
}

export class RegistrationPage extends BasePage {
  async gotoRegistration(): Promise<void> {
    await this.goto('/register.htm')
  }

  async submitRegistration(form: RegistrationForm): Promise<void> {
    await (await this.smartLocate('first name input')).fill(form.firstName)
    await (await this.smartLocate('last name input')).fill(form.lastName)
    await (await this.smartLocate('address input')).fill(form.address)
    await (await this.smartLocate('city input')).fill(form.city)
    await (await this.smartLocate('state input')).fill(form.state)
    await (await this.smartLocate('zip code input')).fill(form.zipCode)
    await (await this.smartLocate('phone input')).fill(form.phone)
    await (await this.smartLocate('ssn input')).fill(form.ssn)
    await (await this.smartLocate('registration username input')).fill(form.username)
    await (await this.smartLocate('registration password input')).fill(form.password)
    await (await this.smartLocate('confirm password input')).fill(form.password)
    await (await this.smartLocate('register submit button')).click()
  }

  async expectWelcomeMessage(username: string): Promise<void> {
    await expect(await this.smartLocate('welcome message')).toContainText(username)
  }
}
