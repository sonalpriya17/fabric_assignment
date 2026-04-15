import { expect, type Locator, type Page } from '@playwright/test'
import type { SmartLocator } from '../ai/smart-locator.js'

export class BasePage {
  constructor(protected readonly page: Page, protected readonly smartLocator: SmartLocator) {}

  protected async smartLocate(hint: string): Promise<Locator> {
    return this.smartLocator.locate(this.page, hint)
  }

  async goto(path = ''): Promise<void> {
    await this.page.goto(path.replace(/^\//, ''))
  }

  async expectUrlContains(fragment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(fragment))
  }
}
