import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect the root URL straight to the dashboard
  redirect('/dashboard');
}
