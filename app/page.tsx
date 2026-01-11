import 'server-only';

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/jobs');
}
