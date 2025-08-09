import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (to, username, verificationUrl) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'تأكيد حسابك في دار القرَاء',
    html: `<p>مرحباً ${username},</p>
           <p>يرجى النقر على الرابط التالي لتأكيد حسابك في دار القرَاء:</p>
           <p><a href="${verificationUrl}">${verificationUrl}</a></p>
           <p>هذا الرابط صالح لمدة ساعة واحدة.</p>
           <p>شكراً لك!</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully.");
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error; // Re-throw the error
  }
};
