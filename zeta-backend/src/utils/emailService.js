import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send OTP email
export const sendOTPEmail = async (email, otp, type = 'registration') => {
  try {
    let subject, html;
    
    if (type === 'registration') {
      subject = 'Verify Your Email - Zeta Exams';
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Welcome to Zeta Exams!</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for registering with Zeta Exams. To complete your registration, please verify your email address using the OTP below:</p>
              <div class="otp-box">${otp}</div>
              <p>This OTP is valid for <strong>10 minutes</strong>.</p>
              <p>If you didn't request this, please ignore this email.</p>
              <p>Best regards,<br><strong>Team Zeta Exams</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Zeta Exams. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'password-reset') {
      subject = 'Reset Your Password - Zeta Exams';
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #f5576c; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your Zeta Exams account. Use the OTP below to reset your password:</p>
              <div class="otp-box">${otp}</div>
              <p>This OTP is valid for <strong>10 minutes</strong>.</p>
              <div class="warning">
                <strong>⚠️ Security Note:</strong> If you didn't request this password reset, please ignore this email and consider changing your password immediately.
              </div>
              <p>Best regards,<br><strong>Team Zeta Exams</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Zeta Exams. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
    
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [email],
      subject: subject,
      html: html
    });

    if (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send email');
    }

    console.log('Email sent successfully:', data);
    return true;

  } catch (error) {
    console.error('Email service error:', error);
    throw new Error('Failed to send email');
  }
};

// Send subscription confirmation email
export const sendSubscriptionEmail = async (email, subscriptionType, endDate) => {
  try {
    const subject = '🎉 Subscription Activated - Zeta Exams';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .subscription-box { background: white; border: 2px solid #43e97b; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Subscription Activated!</h1>
          </div>
          <div class="content">
            <p>Congratulations!</p>
            <p>Your <strong>${subscriptionType.toUpperCase()}</strong> subscription has been successfully activated.</p>
            <div class="subscription-box">
              <h3>Subscription Details:</h3>
              <p><strong>Plan:</strong> ${subscriptionType.toUpperCase()}</p>
              <p><strong>Valid Until:</strong> ${new Date(endDate).toLocaleDateString('en-IN')}</p>
            </div>
            <p>You can now access all the premium features. Happy learning! 📚</p>
            <p>Best regards,<br><strong>Team Zeta Exams</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Zeta Exams. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await resend.emails.send({
      from: 'Zeta Exams <noreply@zetaexams.com>',
      to: [email],
      subject: subject,
      html: html
    });

    return true;

  } catch (error) {
    console.error('Subscription email error:', error);
    return false;
  }
};