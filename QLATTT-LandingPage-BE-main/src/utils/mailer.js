const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;

// DEBUG - xóa sau khi fix xong
console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 20) + '...' : 'UNDEFINED');
console.log('SMTP_USER:', process.env.SMTP_USER);

client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;