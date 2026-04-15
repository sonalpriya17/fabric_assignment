import type { BillPaymentForm } from '../pages/bill-payment.page.js'
import type { RegistrationForm } from '../pages/registration.page.js'

function randomToken(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`
}

export function createRandomCredentials(): { username: string; password: string } {
  return {
    username: randomToken('user'),
    password: randomToken('Pwd@'),
  }
}

export function createRandomAmount(min = 1, max = 999): string {
  const value = Math.floor(Math.random() * (max - min + 1)) + min
  return `${value}`
}

export function createRandomRegistrationData(hint: string): RegistrationForm {
  const usernameBase = hint === '<AI_GENERATED>' ? 'u' : hint.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 4) || 'u'
  const suffix = `${Math.random().toString(36).slice(2, 7)}${Date.now().toString(36).slice(-6)}`
  const username = `${usernameBase}${suffix}`.slice(0, 18)
  const password = randomToken('Pwd@').slice(0, 16)

  return {
    firstName: randomToken('first').slice(0, 12),
    lastName: randomToken('last').slice(0, 12),
    address: randomToken('addr').slice(0, 16),
    city: randomToken('city').slice(0, 12),
    state: randomToken('state').slice(0, 8),
    zipCode: `${Math.floor(10000 + Math.random() * 89999)}`,
    phone: `${Math.floor(1000000000 + Math.random() * 8999999999)}`,
    ssn: `${Math.floor(100000000 + Math.random() * 899999999)}`,
    username,
    password,
  }
}

export function createRandomBillPaymentData(): BillPaymentForm {
  const account = `${Math.floor(100000 + Math.random() * 899999)}`
  return {
    payeeName: randomToken('payee').slice(0, 14),
    address: randomToken('addr').slice(0, 16),
    city: randomToken('city').slice(0, 12),
    state: randomToken('state').slice(0, 8),
    zipCode: `${Math.floor(10000 + Math.random() * 89999)}`,
    phone: `${Math.floor(1000000000 + Math.random() * 8999999999)}`,
    account,
    verifyAccount: account,
    amount: createRandomAmount(),
  }
}
