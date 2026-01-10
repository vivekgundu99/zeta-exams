import { Resend } from 'resend';

// Initialize Resend
const resendInstance = new Resend(process.env.RESEND_API_KEY);

// Send OTP email
// Send OTP email
export const sendOTPEmail = async (email, otp, type = 'registration') => {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY is not configured');
      console.log('📧 OTP for testing (COPY THIS):', otp);
      console.log('📧 Email would be sent to:', email);
      return true;
    }

    console.log('Attempting to send email to:', email);
    console.log('Email type:', type);
    
    let subject, html;
    
    if (type === 'registration') {
      subject = 'Verify Your Email - Zeta Exams';
      html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">🎓 Welcome to Zeta Exams!</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
      <p>Hello,</p>
      <p>Thank you for registering with Zeta Exams. To complete your registration, please verify your email address using the OTP below:</p>
      <div style="background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px;">
        ${otp}
      </div>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>Team Zeta Exams</p>
    </div>
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
      © ${new Date().getFullYear()} Zeta Exams. All rights reserved.
    </div>
  </div>
</body>
</html>`;
    } else if (type === 'password-reset') {
      subject = 'Reset Your Password - Zeta Exams';
      html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">🔐 Password Reset Request</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
      <p>Hello,</p>
      <p>We received a request to reset your password for your Zeta Exams account. Use the OTP below to reset your password:</p>
      <div style="background: white; border: 2px dashed #f5576c; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px;">
        ${otp}
      </div>
      <p>This OTP is valid for 10 minutes.</p>
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>⚠️ Security Note:</strong> If you didn't request this password reset, please ignore this email and consider changing your password immediately.
      </div>
      <p>Best regards,<br>Team Zeta Exams</p>
    </div>
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
      © ${new Date().getFullYear()} Zeta Exams. All rights reserved.
    </div>
  </div>
</body>
</html>`;
    }
    
    const { data, error } = await resendInstance.emails.send({
      from: 'Zeta Exams <onboarding@zetaexams.in>',
      to: email,
      subject: subject,
      html: html
    });

    if (error) {
      console.error('❌ Resend email error:', error);
      console.log('📧 OTP for manual use:', otp);
      return true;
    }

    console.log('✅ Email sent successfully:', data);
    return true;

  } catch (error) {
    console.error('❌ Email service error:', error);
    console.log('📧 OTP for manual use:', otp);
    return true;
  }
};

// Send subscription confirmation email
export const sendSubscriptionEmail = async (email, subscriptionType, endDate) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️ RESEND_API_KEY not configured, skipping subscription email');
      return true;
    }
    
    const subject = '🎉 Subscription Activated - Zeta Exams';
    const html = `
      
      
      
        
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .subscription-box { background: white; border: 2px solid #43e97b; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        
      
      
        
          
            🎉 Subscription Activated!
          
          
            Congratulations!
            Your ${subscriptionType.toUpperCase()} subscription has been successfully activated.
            
              Subscription Details:
              Plan: ${subscriptionType.toUpperCase()}
              Valid Until: ${new Date(endDate).toLocaleDateString('en-IN')}
            
            You can now access all the premium features. Happy learning! 📚
            Best regards,Team Zeta Exams
          
          
            © ${new Date().getFullYear()} Zeta Exams. All rights reserved.
          
        
      
      
    `;
    
    await resendInstance.emails.send({
      from: 'Zeta Exams <noreply@zetaexams.in>',
      to: email,
      subject: subject,
      html: html
    });

    console.log('✅ Subscription email sent successfully');
    return true;

  } catch (error) {
    console.error('❌ Subscription email error:', error);
    return true;
  }
};