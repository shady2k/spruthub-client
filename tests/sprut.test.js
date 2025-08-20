const { WebSocketServer } = require("ws");
const { Sprut } = require("../src/index");

const responseRules = [
  {
    match: (message) => Array.isArray(message.params?.account?.auth?.params),
    response: (message) => ({
      id: message.id,
      result: {
        account: {
          auth: {
            status: "ACCOUNT_RESPONSE_SUCCESS",
            question: {
              type: "QUESTION_TYPE_EMAIL",
            },
            label: {
              text: "Владелец - test***@**est.com",
            },
          },
        },
      },
    }),
  },
  {
    match: (message) =>
      message.params?.account?.answer?.data === "testEmail",
    response: (message) => ({
      id: message.id,
      result: {
        account: {
          answer: {
            question: {
              delay: 0,
              type: "QUESTION_TYPE_PASSWORD",
            },
          },
        },
      },
    }),
  },
  {
    match: (message) =>
      message.params?.account?.answer?.data === "testPassword",
    response: (message) => ({
      id: message.id,
      result: {
        account: {
          answer: {
            status: "ACCOUNT_RESPONSE_SUCCESS",
            token: "testToken",
          },
        },
      },
    }),
  },
  {
    match: (message) => message.params?.characteristic?.update?.aId === 167,
    response: (message) => ({
      id: message.id,
      result: {
        characteristic: {
          update: {},
        },
      },
    }),
  },
  {
    match: (message) => message.params?.server?.version,
    response: (message) => ({
      id: message.id,
      result: {
        server: {
          version: {
            timestamp: 1710699726,
            lastBuildTime: 1710703222,
            revision: 11847,
            release: 11847,
            beta: 11847,
            test: 11911,
            main: 3411,
            early: 3411,
            lastRevision: 11847,
            lastMain: 3411,
            lastEarly: 3411,
            discovery: false,
            platform: {
              manufacturer: "IMAQLIQ",
              model: "gbox-x3",
              serial: "FFFFFFFFFFF",
              mac: "AAAAAAAAAAA",
              firmware: "20240309_1828_spruthub2",
              jdk: "1.8.0_402 (Zulu 8.76.0.17-CA-linux_aarch64)",
            },
            branch: "release",
            version: "1.9.10",
            lastVersion: "1.9.10",
            owner: "test@test.com",
            manufacturer: "Sprut.hub",
            model: "2",
            serial: "DDDDDDDDDDDDDDDD",
          },
        },
      },
    }),
  },
];

describe("Sprut WebSocket Client", () => {
  let server;
  let sprut;

  beforeAll(async () => {
    // Start a mock WebSocket server
    server = new WebSocketServer({ port: 1236 });

    server.on("connection", (ws) => {
      ws.on("message", (data) => {
        const receivedMessage = JSON.parse(data);
        const rule = responseRules.find((rule) => rule.match(receivedMessage));
        const response = rule
          ? rule.response(receivedMessage)
          : {
              id: receivedMessage.id,
              receivedMessage: JSON.stringify(receivedMessage),
              error: "No matching rule for message",
            };
        // Send the response back to the client
        ws.send(JSON.stringify(response));
      });
    });

    // Initialize Sprut with mock WebSocket URL
    sprut = new Sprut({
      wsUrl: "ws://localhost:1236",
      sprutEmail: "testEmail",
      sprutPassword: "testPassword",
      serial: "testSerial",
      logger: {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
      },
    });

    await sprut.connected();
  });

  afterAll((done) => {
    sprut.close().then(() => {
      for (const ws of server.clients) {
        ws.close();
      }
      server.close();
      setTimeout(() => done(), 1000);
    });
  });

  test("handles WebSocket connection", async () => {
    expect(sprut.isConnected).toBe(true);
  });

  test("authentication flow", async () => {
    const authResult = await sprut.auth();
    expect(authResult.isError).toBe(false);
    expect(authResult.result.token).toBe("testToken");
  });

  test("device update command", async () => {
    const resultExecute = await sprut.execute("update", {
      accessoryId: 167,
      serviceId: 13,
      characteristicId: 15,
      control: {
        value: false
      }
    });

    expect(resultExecute).toMatchObject({
      isSuccess: true,
      code: 0,
      message: "Success",
    });
  });

  test("server version command", async () => {
    const resultExecute = await sprut.version();

    expect(resultExecute).toMatchObject({
      isSuccess: true,
      code: 0,
      message: "Success",
      data: {
        timestamp: 1710699726,
        lastBuildTime: 1710703222,
        revision: 11847,
        release: 11847,
        beta: 11847,
        test: 11911,
        main: 3411,
        early: 3411,
        lastRevision: 11847,
        lastMain: 3411,
        lastEarly: 3411,
        discovery: false,
        platform: {
          manufacturer: "IMAQLIQ",
          model: "gbox-x3",
          serial: "FFFFFFFFFFF",
          mac: "AAAAAAAAAAA",
          firmware: "20240309_1828_spruthub2",
          jdk: "1.8.0_402 (Zulu 8.76.0.17-CA-linux_aarch64)",
        },
        branch: "release",
        version: "1.9.10",
        lastVersion: "1.9.10",
        owner: "test@test.com",
        manufacturer: "Sprut.hub",
        model: "2",
        serial: "DDDDDDDDDDDDDDDD",
      },
    });
  });

  test("reconnection capability", (done) => {
    // Close all WebSocket connections to simulate disconnection
    for (const ws of server.clients) {
      ws.close();
    }

    // Wait for reconnection
    setTimeout(async () => {
      await sprut.connected();
      expect(sprut.isConnected).toBe(true);
      done();
    }, 6000); // Increased timeout to account for reconnection delay
  }, 8000);

  test("invalid command rejection", async () => {
    await expect(
      sprut.execute("invalid", {
        accessoryId: 167,
        serviceId: 13,
        characteristicId: 15,
        control: { value: true }
      })
    ).rejects.toThrow("Command not allowed");
  });

  test("missing parameters validation", async () => {
    await expect(
      sprut.execute("update", {
        accessoryId: 167,
        // Missing serviceId, characteristicId, control
      })
    ).rejects.toThrow("accessoryId, serviceId, characteristicId must be set");
  });

  test("constructor validation", () => {
    expect(() => {
      new Sprut({
        // Missing required parameters
        wsUrl: "ws://localhost:1236",
      });
    }).toThrow("wsUrl, sprutEmail, sprutPassword, serial must be set as env variables");
  });
});