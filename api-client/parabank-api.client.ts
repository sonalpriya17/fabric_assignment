export type TransferRequest = {
  fromAccountId: string
  toAccountId: string
  amount: string
}

export class ParaBankApiClient {
  private token: string | null = null

  constructor(private readonly baseUrl: string) {}

  setToken(token: string): void {
    this.token = token
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    }
  }

  async getAccounts(): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/services_proxy/bank/accounts`, {
      method: 'GET',
      headers: this.headers,
    })
    return res.json()
  }

  async transferFunds(input: TransferRequest): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/services_proxy/bank/transfer`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(input),
    })
    return res.json()
  }

  async findTransactionsByAmount(accountId: string, amount: string): Promise<unknown> {
    const endpoint = `${this.baseUrl}/services_proxy/bank/accounts/${accountId}/transactions/amount/${amount}`
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: this.headers,
    })
    return res.json()
  }
}
