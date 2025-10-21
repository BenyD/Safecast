import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import OtpEmail from '@/emails/OtpEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

// Create Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate a cryptographically secure 6-digit OTP
    const crypto = await import('crypto');
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);
    const otp = (randomNumber % 900000 + 100000).toString();
    
    // Store OTP in Supabase database for verification
    // We'll create a simple OTP table or use a custom approach
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .insert([
        {
          email: email,
          code: otp,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
          attempts: 0,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      return NextResponse.json(
        { error: 'Failed to generate OTP' },
        { status: 500 }
      );
    }

    // Render the email template with the OTP code
    const emailHtml = render(OtpEmail({ 
      validationCode: otp
    }));

    // Send email using Resend with your verified domain
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'SafeCast <safecast@beny.one>',
      to: [email],
      subject: 'Your SafeCast Verification Code',
      html: await emailHtml,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Check if user already exists in Supabase Auth
    let isExistingUser = false;
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      if (existingUsers?.users) {
        isExistingUser = existingUsers.users.some(user => user.email === email);
      }
    } catch (error) {
      console.log('Could not check existing users:', error);
      // Continue anyway - this is not critical
    }

    console.log('OTP sent successfully:', { 
      email, 
      messageId: emailData?.id,
      otpId: otpData?.id,
      isExistingUser
    });

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      email: email,
      messageId: emailData?.id,
      isExistingUser
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
