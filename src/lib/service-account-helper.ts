/**
 * Helper utilities for users who have Google Service Account JSON files
 * but need to create API Keys instead for browser-based applications.
 */

interface ServiceAccountJSON {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
  universe_domain: string
}

/**
 * Extracts useful information from a service account JSON file
 * to help users create an API key for the correct project.
 * 
 * ⚠️ SECURITY WARNING: This function should only be used to extract
 * the project ID. Never use the private key or other sensitive data
 * in a browser application!
 */
export function extractProjectInfo(serviceAccountJson: string): {
  projectId: string
  clientEmail: string
  warning: string
} {
  try {
    const serviceAccount: ServiceAccountJSON = JSON.parse(serviceAccountJson)
    
    return {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      warning: '⚠️ Service Account JSON contains private keys and should NOT be used in browser apps. Create an API Key instead!'
    }
  } catch (error) {
    throw new Error('Invalid service account JSON format')
  }
}

/**
 * Generates instructions for creating an API key from a service account project
 */
export function getApiKeyInstructions(projectId: string): string {
  return `
To create an API Key for your project "${projectId}":

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Select your project: "${projectId}"
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "API Key"
5. Restrict the key to Speech-to-Text and Natural Language APIs
6. Copy the API key and paste it into Audio Journal settings

⚠️ Never use the service account JSON file in browser applications!
`
}

/**
 * Validates that the required APIs are enabled for the project
 */
export function getRequiredAPIs(): string[] {
  return [
    'Cloud Speech-to-Text API',
    'Cloud Natural Language API'
  ]
}
