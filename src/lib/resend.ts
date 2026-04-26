import { Resend } from 'resend'

// Initialize the Resend client.
// This relies on RESEND_API_KEY being set in .env.local
const resendApiKey = process.env.RESEND_API_KEY

// Create a singleton instance if we have a key
export const resend = resendApiKey ? new Resend(resendApiKey) : null

// Utility wrapper allowing us to gracefully skip emails in dev if no key is found
export async function sendEmailSafe(params: Parameters<Resend['emails']['send']>[0]) {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Email blocked:', params.subject)
    return { data: null, error: 'RESEND_API_KEY_MISSING' }
  }

  try {
    // TODO: Remove EMAIL_TEST_OVERRIDE before production
    const testOverride = process.env.EMAIL_TEST_OVERRIDE
    const finalParams = { ...params }
    if (testOverride) {
      finalParams.to = [testOverride]
    }

    const { data, error } = await resend.emails.send(finalParams)
    if (error) {
      console.error('Failed to send email:', error)
    }
    return { data, error }
  } catch (err) {
    console.error('Error sending email via Resend:', err)
    return { data: null, error: err }
  }
}
