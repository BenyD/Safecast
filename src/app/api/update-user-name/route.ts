import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Update the user's name in the database
    const { data, error } = await supabase
      .from('users')
      .update({ name: name })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('Error updating user name:', error);
      return NextResponse.json(
        { error: 'Failed to update user name' },
        { status: 500 }
      );
    }

    console.log('User name updated successfully:', { email, name });

    return NextResponse.json({
      success: true,
      message: 'User name updated successfully',
      user: data
    });

  } catch (error) {
    console.error('Error updating user name:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
