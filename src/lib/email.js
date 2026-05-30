const nodemailer = require("nodemailer");

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    return null;
  }

  return { host, port, user, pass, from };
};

const sendEmail = async ({ to, subject, html }) => {
  const config = getSmtpConfig();
  if (!config) {
    const error = new Error("SMTP_NOT_CONFIGURED");
    error.code = "SMTP_NOT_CONFIGURED";
    throw error;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail };
