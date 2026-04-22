/**
 * MY APP – Root Page
 *
 * Redirects authenticated users to the dashboard and unauthenticated
 * users to the login page.
 *
 * TODO: Replace with a marketing landing page if needed.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
