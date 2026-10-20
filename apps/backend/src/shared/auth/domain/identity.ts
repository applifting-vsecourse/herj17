export class Identity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string | null,
    public readonly role: string,
  ) {}
}

// request.session.user is a plain object, not an Identity instance, so this is
// a function rather than a method
export const isAdmin = (identity: Identity): boolean =>
  identity.role === 'admin';
