'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { signInAndRoute, type LoginActionState } from './actions';

function SubmitButton() {
	const { pending } = useFormStatus();
	return (
		<button
			type="submit"
			disabled={pending}
			className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
		>
			{pending ? 'Logging in…' : 'Login'}
		</button>
	);
}

export function LoginForm() {
	const [state, formAction] = useFormState<LoginActionState, FormData>(signInAndRoute, {});

	return (
		<form action={formAction} className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-gray-900">Email</label>
				<input
					name="email"
					type="email"
					required
					autoComplete="email"
					className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm"
				/>
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-900">Password</label>
				<input
					name="password"
					type="password"
					required
					autoComplete="current-password"
					className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm"
				/>
			</div>
			<div>
				<SubmitButton />
			</div>
			{state.blocked ? (
				<p className="text-sm text-gray-900">BLOCKED: {state.blocked}</p>
			) : null}
		</form>
	);
}
