import Link from 'next/link';

function IconButton({
	label,
	disabledReason,
	children,
}: {
	label: string;
	disabledReason: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			aria-disabled="true"
			title={disabledReason}
			className="h-9 w-9 grid place-items-center text-[#9CA3AF] hover:text-[#E5E7EB] aria-disabled:text-[#6B7280] cursor-not-allowed"
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
		>
			<span className="sr-only">{label}</span>
			{children}
		</button>
	);
}

function MessageIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path
				d="M4 5.5C4 4.11929 5.11929 3 6.5 3H17.5C18.8807 3 20 4.11929 20 5.5V14.5C20 15.8807 18.8807 17 17.5 17H9L5.2 20.2C4.87333 20.48 4.4 20.2473 4.4 19.82V17H6.5C5.11929 17 4 15.8807 4 14.5V5.5Z"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinejoin="round"
			/>
			<path d="M7 7.8H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M7 11.2H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	);
}

function BellIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path
				d="M12 21C13.1046 21 14 20.1046 14 19H10C10 20.1046 10.8954 21 12 21Z"
				fill="currentColor"
			/>
			<path
				d="M18 8C18 5.23858 15.7614 3 13 3H11C8.23858 3 6 5.23858 6 8V12.6L4.8 15.2C4.47085 15.9425 5.01462 16.8 5.82 16.8H18.18C18.9854 16.8 19.5291 15.9425 19.2 15.2L18 12.6V8Z"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function UserIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path
				d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
				stroke="currentColor"
				strokeWidth="1.8"
			/>
			<path
				d="M20 20.2C20 16.8654 16.4183 14.2 12 14.2C7.58172 14.2 4 16.8654 4 20.2"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function JobsTopNav() {
	return (
		<header className="sticky top-0 z-40 h-12 border-b border-[#1F2A44] bg-[#0B1220]">
			<div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4">
				<Link href="/jobs" className="text-sm font-semibold text-[#E5E7EB]">
					The Rail Exchange
				</Link>

				<nav className="flex items-center gap-2">
					<IconButton label="Messages" disabledReason="Disabled: messaging is not implemented yet.">
						<MessageIcon />
					</IconButton>
					<IconButton label="Notifications" disabledReason="Disabled: notifications are not implemented yet.">
						<BellIcon />
					</IconButton>
					<Link
						href="/my-profile"
						title="My Profile"
						className="h-9 w-9 grid place-items-center text-[#9CA3AF] hover:text-[#E5E7EB]"
					>
						<span className="sr-only">My Profile</span>
						<UserIcon />
					</Link>
				</nav>
			</div>
		</header>
	);
}
