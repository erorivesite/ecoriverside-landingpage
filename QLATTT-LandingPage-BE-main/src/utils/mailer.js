const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;

console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 20) + '...' : 'UNDEFINED');
console.log('SMTP_USER:', process.env.SMTP_USER);

client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendMail = async ({ to, toName, subject, html }) => {
  const email = new SibApiV3Sdk.SendSmtpEmail();
  email.sender = { name: 'ECO Riverside', email: process.env.SMTP_USER };
  email.to = [{ email: to, name: toName || to }];
  email.subject = subject;
  email.htmlContent = html;

  return apiInstance.sendTransacEmail(email);
};

module.exports = sendMail;