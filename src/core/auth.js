const Helpers = require('../utils/helpers');

class AuthManager {
  constructor(sprutEmail, sprutPassword, logger, callMethod) {
    this.sprutEmail = sprutEmail;
    this.sprutPassword = sprutPassword;
    this.log = logger;
    this.call = callMethod;
    this.token = null;
    this.generation = 0;
    this.authentication = null;
  }

  isAuthenticated() { return !!this.token; }
  getToken() { return this.token; }
  setToken(token) { this.cancelAuthentication(); this.token = token; }

  cancelAuthentication() {
    this.generation++;
    this.authentication = null;
  }

  clearToken() {
    this.cancelAuthentication();
    this.token = null;
  }

  authenticate() {
    if (this.authentication) return this.authentication;
    const attempt = this.performAuthentication(this.generation);
    this.authentication = attempt;
    const finished = () => { if (this.authentication === attempt) this.authentication = null; };
    attempt.then(finished, finished);
    return attempt;
  }

  async performAuthentication(generation) {
    const check = () => {
      if (generation !== this.generation) throw new Error('Authentication cancelled');
    };
    const request = async params => {
      check();
      const result = await this.call(params);
      check();
      return result;
    };
    const initial = await request({ account: { auth: { params: [] } } });
    if (Helpers.getNestedProperty(initial, ['result', 'account', 'auth', 'status']) !== 'ACCOUNT_RESPONSE_SUCCESS' ||
        Helpers.getNestedProperty(initial, ['result', 'account', 'auth', 'question', 'type']) !== 'QUESTION_TYPE_EMAIL') {
      throw new Error('Expected email question type.');
    }
    const email = await request({ account: { answer: { data: this.sprutEmail } } });
    if (Helpers.getNestedProperty(email, ['result', 'account', 'answer', 'question', 'type']) !== 'QUESTION_TYPE_PASSWORD') {
      throw new Error('Expected password question type.');
    }
    const password = await request({ account: { answer: { data: this.sprutPassword } } });
    const answer = Helpers.getNestedProperty(password, ['result', 'account', 'answer']);
    if (answer?.status !== 'ACCOUNT_RESPONSE_SUCCESS' || !answer.token) throw new Error('Authentication failed.');
    check();
    this.token = answer.token;
    return { isError: false, result: { token: this.token } };
  }

  async ensureAuthenticated() {
    if (!this.token) await this.authenticate();
  }

  refreshToken() {
    if (this.authentication) return this.authentication;
    this.clearToken();
    return this.authenticate();
  }
}

module.exports = AuthManager;
