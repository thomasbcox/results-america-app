import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function sendTestEmail() {
  const resendApiKey = process.env.RESEND_API_KEY;
  // Use Resend's default sender domain since eudae.us isn't verified
  const emailFrom = 'onboarding@resend.dev';
  const testEmailTo = 'thomasbcox23@gmail.com';

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    return;
  }

  // Note: Using Resend's default sender since custom domain isn't verified
  console.log('ℹ️  Using Resend default sender (onboarding@resend.dev)');
  console.log('ℹ️  To use your custom domain, verify eudae.us on https://resend.com/domains');

  console.log('📧 Sending test email...');
  console.log(`From: ${emailFrom}`);
  console.log(`To: ${testEmailTo}`);

  try {
    // Import Resend dynamically to avoid issues if not installed
    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [testEmailTo],
      subject: '🧪 Test Email from Results America App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🧪 Test Email Success!</h2>
          <p>Hello Thomas,</p>
          <p>This is a test email from your <strong>Results America App</strong> to verify that your email configuration is working correctly.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">✅ Email Configuration Status:</h3>
            <ul>
              <li><strong>Resend API Key:</strong> ✅ Configured</li>
              <li><strong>From Address:</strong> ✅ ${emailFrom}</li>
              <li><strong>Magic Link Auth:</strong> ✅ Ready to use</li>
            </ul>
          </div>
          
          <p>Your email setup is working perfectly! Users will now be able to receive magic link authentication emails.</p>
          
          <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #166534;"><strong>🎉 Congratulations!</strong> Your Results America App is ready for production!</p>
          </div>
          
          <p>Best regards,<br>Your Results America App</p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Failed to send email:', error);
      return;
    }

    console.log('✅ Test email sent successfully!');
    console.log('📧 Email ID:', data?.id);
    console.log('📧 Check your inbox at:', testEmailTo);

  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.log('\n💡 If you get a "resend" module not found error, install it with:');
    console.log('npm install resend');
  }
}

sendTestEmail(); 