class AuthManager {
  constructor(sprutEmail, sprutPassword, logger, callMethod) {
    this.sprutEmail = sprutEmail;
    this.sprutPassword = sprutPassword;
    this.log = logger;
    this.call = callMethod;
    this.token = null;
  }

  isAuthenticated() {
    return !!this.token;
  }

  getToken() {
    return this.token;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  _getNestedProperty(obj, path, defaultValue) {
    return path.reduce(
      (acc, key) => (acc && acc[key] ? acc[key] : defaultValue),
      obj
    );
  }

  async authenticate() {
    return new Promise((resolve, reject) => {
      // Step 1: Initial auth request
      this.call({
        account: {
          auth: {
            params: [],
          },
        },
      })
        .then((authCall) => {
          if (
            this._getNestedProperty(authCall, [
              "result",
              "account",
              "auth",
              "status",
            ]) !== "ACCOUNT_RESPONSE_SUCCESS" ||
            this._getNestedProperty(authCall, [
              "result",
              "account",
              "auth",
              "question",
              "type",
            ]) !== "QUESTION_TYPE_EMAIL"
          ) {
            reject(new Error("Expected email question type."));
          } else {
            // Step 2: Send email
            this.call({
              account: {
                answer: {
                  data: this.sprutEmail,
                },
              },
            })
              .then((emailCall) => {
                if (
                  this._getNestedProperty(emailCall, [
                    "result",
                    "account",
                    "answer",
                    "question",
                    "type",
                  ]) !== "QUESTION_TYPE_PASSWORD"
                ) {
                  reject(new Error("Expected password question type."));
                } else {
                  // Step 3: Send password
                  this.call({
                    account: {
                      answer: {
                        data: this.sprutPassword,
                      },
                    },
                  })
                    .then((passwordCall) => {
                      if (
                        this._getNestedProperty(passwordCall, [
                          "result",
                          "account",
                          "answer",
                          "status",
                        ]) !== "ACCOUNT_RESPONSE_SUCCESS"
                      ) {
                        reject(new Error("Authentication failed."));
                      } else {
                        this.token = passwordCall.result.account.answer.token;
                        resolve({
                          isError: false,
                          result: {
                            token: this.token,
                          },
                        });
                      }
                    })
                    .catch(reject);
                }
              })
              .catch(reject);
          }
        })
        .catch(reject);
    });
  }

  async ensureAuthenticated() {
    if (!this.token) {
      const authResult = await this.authenticate();
      if (authResult.isError) {
        throw new Error("Authentication failed.");
      }
    }
  }

  async refreshToken() {
    this.clearToken();
    return await this.authenticate();
  }
}

module.exports = AuthManager;