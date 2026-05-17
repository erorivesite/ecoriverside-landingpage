const Brevo = require('@getbrevo/brevo');

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications['api-key'].apiKey = process.env.SMTP_PASS;

const sendMail = async ({ to, toName, subject, html }) => {
  const email = new Brevo.SendSmtpEmail();
  email.sender = { name: 'ECO Riverside', email: process.env.SMTP_USER };
  email.to = [{ email: to, name: toName || to }];
  email.subject = subject;
  email.htmlContent = html;

  return apiInstance.sendTransacEmail(email);
};

module.exports = sendMail;