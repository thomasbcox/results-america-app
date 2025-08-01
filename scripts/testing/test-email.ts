import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('📧 Testing Email Configuration...\n');

// Check Resend configuration
const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

console.log('Resend API Key:', resendApiKey ? '✅ Configured' : '❌ Missing');
console.log('Email From:', emailFrom ? `✅ ${emailFrom}` : '❌ Missing');

if (resendApiKey && emailFrom) {
  console.log('\n✅ Email configuration looks good!');
  console.log('📧 Magic link authentication should work properly.');
} else {
  console.log('\n❌ Email configuration incomplete.');
  console.log('📧 Magic link authentication will not work until email is configured.');
}

// Check other email-related environment variables
console.log('\n📋 Other Email Settings:');
console.log('SMTP_HOST:', process.env.SMTP_HOST ? '✅ Configured' : '❌ Not configured (using Resend)');
console.log('SMTP_PORT:', process.env.SMTP_PORT ? '✅ Configured' : '❌ Not configured (using Resend)');
console.log('SMTP_USER:', process.env.SMTP_USER ? '✅ Configured' : '❌ Not configured (using Resend)');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ Configured' : '❌ Not configured (using Resend)'); 