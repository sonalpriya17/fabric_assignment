import { BasePage } from './base.page.js'

export class LoginPage extends BasePage {
  async login(username: string, password: string): Promise<void> {
    await (await this.smartLocate('username input')).fill(username)
    await (await this.smartLocate('password input')).fill(password)
    await (await this.smartLocate('login button')).click()
  }

  async gotoLogin(): Promise<void> {
    await this.goto('/')
  }

  async logoutIfVisible(): Promise<void> {
    const logout = this.page.locator('a', { hasText: 'Log Out' })
    if (await logout.count()) {
      await logout.first().click()
    }
  }
}
