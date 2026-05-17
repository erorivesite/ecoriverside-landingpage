const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.SMTP_PASS;

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