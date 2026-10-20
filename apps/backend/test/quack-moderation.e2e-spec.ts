// End-to-end test of quack moderation. It talks HTTP to the running app
// (`pnpm dev`) and signs in with the seeded accounts, so nothing is mocked:
// session cookies, the guard, the service check and the database all take part.
//
// Run: pnpm backend test:e2e   (E2E_BACKEND_URL overrides the default)

const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:4050';
// BetterAuth rejects requests whose Origin isn't a trusted one
const ORIGIN = process.env.E2E_FRONTEND_URL ?? 'http://localhost:3050';

const AUTHOR = { email: 'caffeinatedduck@example.com', password: 'password1' };
const SOMEONE_ELSE = {
  email: 'deepduckthoughts@example.com',
  password: 'password2',
};
const ADMIN = { email: 'admin@example.com', password: 'adminpassword' };

type Credentials = { email: string; password: string };

const signIn = async ({ email, password }: Credentials): Promise<string> => {
  const response = await fetch(`${BACKEND_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email, password }),
  });
  expect(response.status).toBe(200);
  // keep just "name=value" of each cookie for the Cookie header
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
};

const request = (
  cookie: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> =>
  fetch(`${BACKEND_URL}/api${path}`, {
    method,
    headers: {
      Cookie: cookie,
      Origin: ORIGIN,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const postQuack = async (cookie: string, text: string): Promise<string> => {
  const response = await request(cookie, 'POST', '/quacks', { text });
  expect(response.status).toBe(201);
  const quack = (await response.json()) as { id: string };
  return quack.id;
};

const feedIds = async (cookie: string): Promise<string[]> => {
  const response = await request(cookie, 'GET', '/quacks');
  expect(response.status).toBe(200);
  const quacks = (await response.json()) as { id: string }[];
  return quacks.map((quack) => quack.id);
};

describe('Quack moderation (e2e)', () => {
  let author: string;
  let someoneElse: string;
  let admin: string;

  beforeAll(async () => {
    [author, someoneElse, admin] = await Promise.all([
      signIn(AUTHOR),
      signIn(SOMEONE_ELSE),
      signIn(ADMIN),
    ]);
  });

  it("refuses a regular user someone else's quack, and lets the admin delete it", async () => {
    const quackId = await postQuack(author, `e2e: nasty quack ${Date.now()}`);

    const asSomeoneElse = await request(
      someoneElse,
      'DELETE',
      `/quacks/${quackId}`,
    );
    expect(asSomeoneElse.status).toBe(403);
    expect(await feedIds(author)).toContain(quackId);

    const asAdmin = await request(admin, 'DELETE', `/quacks/${quackId}`);
    expect(asAdmin.status).toBe(204);
    expect(await feedIds(author)).not.toContain(quackId);
  });

  it('still lets the author delete their own quack', async () => {
    const quackId = await postQuack(author, `e2e: my own quack ${Date.now()}`);

    const response = await request(author, 'DELETE', `/quacks/${quackId}`);
    expect(response.status).toBe(204);
  });
});
