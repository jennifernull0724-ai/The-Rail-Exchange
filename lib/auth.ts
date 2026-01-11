import 'server-only';

export type UserRole = 'logistics_company' | 'contractor';

export type ServerAuthContext = {
  userId: string;
  role: UserRole;
  companyId: string;
  subscriptionActive: boolean;
};

export class AuthContextError extends Error {
  override name = 'AuthContextError';
}

type RequestLike = {
  headers: Headers;
};

declare const process: {
  env: Record<string, string | undefined>;
};

function isNonEmptyNoWhitespace(value: string): boolean {
  if (value.trim().length === 0) return false;
  return !/\s/.test(value);
}

function requireHeader(headers: Headers, name: string): string {
  const value = headers.get(name);
  if (value === null) {
    throw new AuthContextError(`Missing required auth header: ${name}`);
  }
  const trimmed = value.trim();
  if (!isNonEmptyNoWhitespace(trimmed)) {
    throw new AuthContextError(`Invalid auth header ${name}: must be a non-empty value with no whitespace`);
  }
  return trimmed;
}

function isMissingHeaderError(err: unknown): err is AuthContextError {
  return err instanceof AuthContextError && err.message.startsWith('Missing required auth header:');
}

function requireDevEnv(name: 'DEV_USER_ID' | 'DEV_USER_ROLE' | 'DEV_COMPANY_ID' | 'DEV_SUBSCRIPTION_ACTIVE'): string {
  const value = process.env[name];
  if (value === undefined || value.trim().length === 0) {
    throw new AuthContextError(`DEV auth bridge blocked: missing required env var ${name}`);
  }
  const trimmed = value.trim();
  if (!isNonEmptyNoWhitespace(trimmed)) {
    throw new AuthContextError(`DEV auth bridge blocked: invalid env var ${name} (must be non-empty with no whitespace)`);
  }
  return trimmed;
}

function parseUserRole(value: string): UserRole {
  if (value === 'logistics_company' || value === 'contractor') return value;
  throw new AuthContextError('Invalid auth header x-user-role: must be "logistics_company" or "contractor"');
}

function parseSubscriptionActive(value: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new AuthContextError('Invalid auth header x-subscription-active: must be "true" or "false"');
}

/**
 * Server-only auth context accessor.
 *
 * Identity enters the backend ONLY via required request headers.
 */
export function getServerAuthContext(req: Request | RequestLike): ServerAuthContext {
  const headers = req.headers;

  try {
    const userId = requireHeader(headers, 'x-user-id');
    const role = parseUserRole(requireHeader(headers, 'x-user-role'));
    const companyId = requireHeader(headers, 'x-company-id');
    const subscriptionActive = parseSubscriptionActive(requireHeader(headers, 'x-subscription-active'));

    return { userId, role, companyId, subscriptionActive };
  } catch (err) {
    if (isMissingHeaderError(err) && process.env.NODE_ENV === 'development') {
      const userId = requireDevEnv('DEV_USER_ID');
      const role = parseUserRole(requireDevEnv('DEV_USER_ROLE'));
      const companyId = requireDevEnv('DEV_COMPANY_ID');
      const subscriptionActive = parseSubscriptionActive(requireDevEnv('DEV_SUBSCRIPTION_ACTIVE'));

      return { userId, role, companyId, subscriptionActive };
    }

    throw err;
  }
}
