import { PublicNavBar } from '@/components/PublicNavBar';
import CreateAccountClient from './CreateAccountClient';

type Role = 'contractor' | 'logistics';

function parseRole(value: string | null): Role | null {
	if (!value) return null;
	if (value === 'logistics' || value === 'contractor') return value;
	return null;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function CreateAccountPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
	const roleParam = typeof searchParams?.role === 'string' ? searchParams.role : null;
	const role = parseRole(roleParam);

	return (
		<div className="min-h-screen bg-gray-50">
			<PublicNavBar />
			<CreateAccountClient initialRole={role} />
		</div>
	);
}
