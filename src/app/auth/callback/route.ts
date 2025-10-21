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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`);
    }

    if (data.user && data.session) {
      // Redirect to the main app with success
      return NextResponse.redirect(`${requestUrl.origin}${next}?auth=success`);
    }
  }

  // If no code or verification failed, redirect to error page
  return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`);
}
