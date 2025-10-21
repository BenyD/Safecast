import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find the OTP record in the database
    // First, clean up any expired OTPs for this email
    await supabase
      .from('otp_codes')
      .delete()
      .eq('email', email)
      .lt('expires_at', new Date().toISOString());

    // Then find the valid OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', otp)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Check attempt limit (max 3 attempts)
    if (otpRecord.attempts >= 3) {
      // Delete the OTP record after too many attempts
      await supabase
        .from('otp_codes')
        .delete()
        .eq('id', otpRecord.id);
      
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify the OTP code
    if (otpRecord.code !== otp) {
      // Increment attempt count
      await supabase
        .from('otp_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);
      
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    // OTP is valid - delete the record and create a user session
    await supabase
      .from('otp_codes')
      .delete()
      .eq('id', otpRecord.id);

    // Create or find user in Supabase auth AND our custom users table
    let userId: string | null = null;

    try {
      // First, try to find existing user in Supabase Auth
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (!listError && existingUsers?.users) {
        const existingUser = existingUsers.users.find(u => u.email === email);
        if (existingUser) {
          userId = existingUser.id;
        }
      }

      // If user doesn't exist in Supabase Auth, create a new one
      if (!userId) {
        const { data: authData, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true,
        });

        if (authData?.user?.id) {
          userId = authData.user.id;
        } else {
          console.error('Failed to create user:', createError);
        }
      }

      // Now ensure the user exists in our custom users table
      if (userId) {
        try {
          const { data: customUser, error: customError } = await supabase
            .from('users')
            .upsert({
              id: userId, // Use the same ID as Supabase Auth
              email: email,
              is_verified: true,
              last_active: new Date().toISOString()
            })
            .select()
            .single();

          if (customError) {
            console.error('Error creating/updating custom user:', customError);
          } else {
            console.log('User created/updated in custom users table:', customUser);
          }
        } catch (error) {
          console.error('Error with custom users table:', error);
        }
      }
    } catch (error) {
      console.error('Error with Supabase auth:', error);
    }

    // Fallback: create a simple user record in our custom users table if Supabase auth fails
    if (!userId) {
      try {
        const { data: customUser, error: customError } = await supabase
          .from('users')
          .upsert({
            email: email,
            is_verified: true,
            last_active: new Date().toISOString()
          })
          .select()
          .single();

        if (customUser && !customError) {
          userId = customUser.id;
        }
      } catch (error) {
        console.error('Error creating custom user:', error);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to create user session' },
        { status: 500 }
      );
    }

    // Get user's name from the database
    let userName = null;
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      if (userData && !userError) {
        userName = userData.name;
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }

    console.log('OTP verified successfully:', { 
      email,
      userId,
      userName
    });

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      user: {
        id: userId,
        email: email,
        name: userName,
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
