import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected. Please connect your Twilio account in the Replit integrations panel.');
  }
  const connectorAccountSid = connectionSettings.settings.account_sid;
  const accountSid = process.env.TWILIO_ACCOUNT_SID
    || (typeof connectorAccountSid === 'string' && connectorAccountSid.startsWith('AC') ? connectorAccountSid : undefined);
  if (!accountSid || !accountSid.startsWith('AC')) {
    throw new Error('Twilio Account SID missing or invalid (must start with "AC"). Set TWILIO_ACCOUNT_SID env var to your Twilio Account SID.');
  }
  const connectorApiKey = connectionSettings.settings.api_key;
  const apiKey = process.env.TWILIO_API_KEY_SID
    || (typeof connectorApiKey === 'string' && connectorApiKey.startsWith('SK') ? connectorApiKey : undefined);
  if (!apiKey || !apiKey.startsWith('SK')) {
    throw new Error('Twilio API Key SID missing or invalid (must start with "SK"). Set TWILIO_API_KEY_SID env var.');
  }
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET || connectionSettings.settings.api_key_secret;
  return {
    accountSid,
    apiKey,
    apiKeySecret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, { accountSid });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendSms(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
    return { success: true, sid: message.sid };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send SMS' };
  }
}
