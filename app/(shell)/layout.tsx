import type { ReactNode } from 'react';

import { TopNavBar } from '@/components/TopNavBar';
import { AppFooter } from '@/components/AppFooter';

export default function ShellLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen pb-16">
			<TopNavBar />
			{children}
			<AppFooter />
		</div>
	);
}
