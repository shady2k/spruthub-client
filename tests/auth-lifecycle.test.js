const AuthManager = require('../src/core/auth');
const first = { result: { account: { auth: { status: 'ACCOUNT_RESPONSE_SUCCESS', question: { type: 'QUESTION_TYPE_EMAIL' } } } } };
const second = { result: { account: { answer: { question: { type: 'QUESTION_TYPE_PASSWORD' } } } } };
const success = token => ({ result: { account: { answer: { status: 'ACCOUNT_RESPONSE_SUCCESS', token } } } });
const waitFor = async predicate => { while (!predicate()) await new Promise(resolve => setImmediate(resolve)); };

test('authentication and refresh are single flight', async () => {
  const call = jest.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second).mockResolvedValueOnce(success('mock'));
  const auth = new AuthManager('mock', 'mock', {}, call);
  const a = auth.authenticate();
  expect(auth.authenticate()).toBe(a);
  expect(auth.refreshToken()).toBe(a);
  await Promise.all([a, auth.ensureAuthenticated()]);
  expect(call).toHaveBeenCalledTimes(3);
  expect(auth.isAuthenticated()).toBe(true);
});

test('late password response cannot restore a cleared token after disconnect', async () => {
  let finish;
  const call = jest.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second)
    .mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const auth = new AuthManager('mock', 'mock', {}, call);
  const attempt = auth.authenticate();
  const rejected = expect(attempt).rejects.toThrow('Authentication cancelled');
  await waitFor(() => finish);
  finish(success('stale-mock'));
  auth.clearToken();
  await rejected;
  expect(auth.getToken()).toBeNull();
  expect(auth.authentication).toBeNull();
});

test('a cancelled generation cannot overwrite a new connection authentication', async () => {
  let finishOld;
  const call = jest.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second)
    .mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }))
    .mockResolvedValueOnce(first).mockResolvedValueOnce(second).mockResolvedValueOnce(success('fresh-mock'));
  const auth = new AuthManager('mock', 'mock', {}, call);
  const old = auth.authenticate();
  const rejected = expect(old).rejects.toThrow('Authentication cancelled');
  await waitFor(() => finishOld);
  auth.clearToken();
  await auth.authenticate();
  finishOld(success('stale-mock'));
  await rejected;
  expect(auth.getToken()).toBe('fresh-mock');
});
