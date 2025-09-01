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
  {
    match: (message) => message.params?.hub?.list,
    response: (message) => ({
      id: message.id,
      result: {
        hub: {
          list: {
            hubs: [
              {
                lastSeen: 1756647767291,
                online: true,
                discovery: false,
                version: {
                  current: {
                    revision: 14788,
                    template: 6339,
                    version: "1.12.3",
                    hardware: "20250622_1708_spruthub2"
                  },
                  upgrade: {
                    revision: 14910,
                    template: 6593,
                    version: "1.12.6"
                  },
                  branch: "release"
                },
                platform: {
                  manufacturer: "IMAQLIQ",
                  model: "gbox-x3",
                  serial: "3IJ4601ED86",
                  mac: "AA09BB01CD86",
                  jdk: "17.0.14 (Zulu17.56+15-CA)"
                },
                serial: "4A89CC2539C6A7A5",
                name: "Test Hub",
                manufacturer: "Sprut.hub",
                model: "2",
                owner: "test@example.com",
                lang: "EN"
              }
            ]
          }
        }
      }
    })
  },
  {
    match: (message) => message.params?.accessory?.list,
    response: (message) => ({
      id: message.id,
      result: {
        accessory: {
          list: {
            accessories: [
              {
                id: 1,
                name: "Test Device",
                roomId: 1,
                online: true,
                manufacturer: "Test",
                model: "Test Model",
                services: [
                  {
                    sId: 1,
                    name: "Test Service",
                    type: "Switch",
                    characteristics: [
                      {
                        cId: 1,
                        control: {
                          name: "On/Off",
                          type: "On",
                          write: true,
                          read: true,
                          value: { boolValue: false }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      }
    })
  },
  {
    match: (message) => message.params?.room?.list,
    response: (message) => ({
      id: message.id,
      result: {
        room: {
          list: {
            rooms: [
              {
                id: 1,
                name: "Living Room",
                visible: true,
                order: 1
              },
              {
                id: 2,
                name: "Kitchen",
                visible: true,
                order: 2
              }
            ]
          }
        }
      }
    })
  },
  {
    match: (message) => message.params?.room?.get?.id === 13,
    response: (message) => ({
      id: message.id,
      result: {
        room: {
          get: {
            id: 13,
            order: 0,
            visible: true,
            name: "Мой дом"
          }
        }
      }
    })
  },
  {
    match: (message) => message.params?.server?.clientInfo,
    response: (message) => ({
      id: message.id,
      result: {
        server: {
          clientInfo: {}
        }
      }
    })
  },
  {
    match: (message) => message.params?.scenario?.create,
    response: (message) => ({
      id: message.id,
      result: {
        scenario: {
          create: {
            order: 3,
            type: message.params.scenario.create.type,
            predefined: false,
            active: message.params.scenario.create.active,
            onStart: message.params.scenario.create.onStart,
            sync: message.params.scenario.create.sync,
            error: false,
            index: "3",
            name: message.params.scenario.create.name,
            desc: message.params.scenario.create.desc
          }
        }
      }
    })
  },
  {
    match: (message) => message.params?.scenario?.update,
    response: (message) => ({
      id: message.id,
      result: {
        scenario: {
          update: {
            order: 3,
            type: "BLOCK",
            predefined: false,
            active: true,
            onStart: true,
            sync: false,
            error: false,
            index: message.params.scenario.update.index,
            name: "Updated Scenario",
            desc: "Updated scenario description",
            iconsThen: ["code"]
          }
        }
      }
    })
  },
  {
    match: (message) => message.params?.scenario?.get?.index === "83",
    response: (message) => ({
      id: message.id,
      result: {
        scenario: {
          get: {
            order: 83,
            type: "BLOCK",
            predefined: false,
            active: true,
            onStart: true,
            sync: false,
            error: false,
            index: "83",
            name: "Test Scenario",
            desc: "Test Description",
            data: "{}"
          }
        }
      }
    })
  },
  {
    match: (message) => message.params?.scenario?.delete?.index === "92",
    response: (message) => ({
      id: message.id,
      result: {
        scenario: {
          delete: {}
        }
      }
    })
  },
  {
    match: (message) => message.params?.service?.types,
    response: (message) => ({
      id: message.id,
      result: {
        service: {
          types: {
            types: [
              {
                system: true,
                id: "",
                shortId: "",
                type: "GenericService",
                name: "Unknown Service",
                optional: [
                  {
                    read: true,
                    write: true,
                    events: true,
                    hidden: false,
                    id: "",
                    shortId: "",
                    type: "GenericBoolean",
                    name: "Boolean Value",
                    format: "Boolean"
                  },
                  {
                    read: true,
                    write: true,
                    events: true,
                    hidden: false,
                    id: "",
                    shortId: "",
                    type: "GenericInteger",
                    name: "Integer Value",
                    format: "Integer"
                  },
                  {
                    read: true,
                    write: true,
                    events: true,
                    hidden: false,
                    id: "",
                    shortId: "",
                    type: "GenericString",
                    name: "String Value",
                    format: "String"
                  }
                ]
              },
              {
                system: true,
                id: "0000003E-0000-1000-8000-0026BB765291",
                shortId: "3E",
                type: "AccessoryInformation",
                name: "Accessory Information",
                required: [
                  {
                    maxLen: 64,
                    read: true,
                    write: false,
                    events: false,
                    hidden: false,
                    id: "00000052-0000-1000-8000-0026BB765291",
                    shortId: "52",
                    type: "FirmwareRevision",
                    name: "Firmware Version",
                    format: "String"
                  },
                  {
                    read: false,
                    write: true,
                    events: false,
                    hidden: false,
                    id: "00000014-0000-1000-8000-0026BB765291",
                    shortId: "14",
                    type: "Identify",
                    name: "Identify",
                    format: "Boolean"
                  },
                  {
                    maxLen: 64,
                    read: true,
                    write: false,
                    events: false,
                    hidden: false,
                    id: "00000023-0000-1000-8000-0026BB765291",
                    shortId: "23",
                    type: "Name",
                    name: "Name",
                    format: "String"
                  }
                ],
                optional: [
                  {
                    maxLen: 64,
                    read: true,
                    write: true,
                    events: true,
                    hidden: false,
                    id: "000000E3-0000-1000-8000-0026BB765291",
                    shortId: "E3",
                    type: "ConfiguredName",
                    name: "ConfiguredName",
                    format: "String"
                  }
                ]
              },
              {
                system: false,
                id: "000000BB-0000-1000-8000-0026BB765291",
                shortId: "BB",
                type: "AirPurifier",
                name: "Air Purifier",
                required: [
                  {
                    minValue: 0,
                    maxValue: 1,
                    minStep: 1,
                    read: true,
                    write: true,
                    events: true,
                    hidden: false,
                    id: "000000B0-0000-1000-8000-0026BB765291",
                    shortId: "B0",
                    type: "Active",
                    name: "Active",
                    format: "Integer",
                    validValues: [
                      {
                        value: { intValue: 0 },
                        key: "INACTIVE",
                        name: "No"
                      },
                      {
                        value: { intValue: 1 },
                        key: "ACTIVE",
                        name: "Yes"
                      }
                    ]
                  }
                ],
                optional: [
                  {
                    minValue: 0,
                    maxValue: 100,
                    minStep: 1,
                    read: true,
                    write: true,
                    events: true,
                    hidden: false,
                    id: "00000029-0000-1000-8000-0026BB765291",
                    shortId: "29",
                    type: "RotationSpeed",
                    name: "Fan Speed (%)",
                    format: "Double",
                    unit: "%"
                  }
                ]
              }
            ]
          }
        }
      }
    })
  },
  {
    match: (message) => message.params?.scenario?.list,
    response: (message) => ({
      id: message.id,
      result: {
        scenario: {
          list: {
            scenarios: [
              {
                order: -1,
                type: "LOGIC", 
                predefined: true,
                active: true,
                onStart: false,
                sync: false,
                error: false,
                index: "SmoothBrightnessChange",
                name: "Плавное изменение яркости",
                desc: "Изменяет яркость включаемой лампочки от начального до конечного значения за указанное количество секунд"
              },
              {
                order: 44,
                type: "LOGIC",
                predefined: false,
                active: true,
                onStart: true,
                sync: false,
                error: false,
                index: "44", 
                name: "Статистика датчиков",
                desc: "Сбор метрик датчиков"
              },
              {
                order: 45,
                type: "BLOCK",
                predefined: false,
                active: true,
                onStart: true,
                sync: false,
                error: false,
                index: "45",
                name: "Температура",
                desc: "",
                rooms: [14],
                iconsIf: ["TemperatureSensor"],
                iconsThen: ["code"]
              },
              {
                order: 2,
                type: "BLOCK",
                predefined: false,
                active: true,
                onStart: true,
                sync: false,
                error: false,
                index: "2",
                name: "Лента на кухне",
                desc: "Лента на кухне",
                rooms: [6, 7],
                iconsIf: ["MotionSensor", "Lightbulb", "LightSensor"],
                iconsThen: ["Lightbulb"]
              }
            ]
          }
        }
      }
    })
  }
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
    expect(sprut.wsManager.isConnected).toBe(true);
  });

  test("authentication flow", async () => {
    const authResult = await sprut.authManager.authenticate();
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
      expect(sprut.wsManager.isConnected).toBe(true);
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

  test("list hubs command", async () => {
    const result = await sprut.listHubs();

    expect(result).toMatchObject({
      isSuccess: true,
      code: 0,
      message: "Success"
    });
    expect(Array.isArray(result.data)).toBe(true);
  });

  test("list accessories command", async () => {
    const result = await sprut.listAccessories();

    expect(result).toMatchObject({
      isSuccess: true,
      code: 0,
      message: "Success"
    });
    expect(Array.isArray(result.data)).toBe(true);
  });

  test("list rooms command", async () => {
    const result = await sprut.listRooms();

    expect(result).toMatchObject({
      isSuccess: true,
      code: 0,
      message: "Success"
    });
    expect(Array.isArray(result.data)).toBe(true);
  });

  test("get room command", async () => {
    const result = await sprut.roomManager.getRoom(13);

    expect(result).toMatchObject({
      isSuccess: true,
      code: 0,
      message: "Success"
    });
    expect(result.data).toMatchObject({
      id: 13,
      name: "Мой дом",
      order: 0,
      visible: true
    });
  });

  test("get service types command", async () => {
    const result = await sprut.call({
      service: { types: {} }
    });

    expect(result).toMatchObject({
      result: {
        service: {
          types: {
            types: expect.arrayContaining([
              expect.objectContaining({
                type: "GenericService",
                system: true
              }),
              expect.objectContaining({
                type: "AccessoryInformation", 
                system: true
              }),
              expect.objectContaining({
                type: "AirPurifier",
                system: false
              })
            ])
          }
        }
      }
    });
    
    // Verify we got the expected service types
    expect(result.result.service.types.types).toHaveLength(3);
    expect(result.result.service.types.types[0].type).toBe("GenericService");
    expect(result.result.service.types.types[1].type).toBe("AccessoryInformation");
    expect(result.result.service.types.types[2].type).toBe("AirPurifier");
  });

  test("get scenario list command", async () => {
    const result = await sprut.call({
      scenario: { list: {} }
    });

    expect(result).toMatchObject({
      result: {
        scenario: {
          list: {
            scenarios: expect.arrayContaining([
              expect.objectContaining({
                index: "SmoothBrightnessChange",
                name: "Плавное изменение яркости",
                type: "LOGIC",
                predefined: true
              }),
              expect.objectContaining({
                index: "44",
                name: "Статистика датчиков", 
                type: "LOGIC",
                predefined: false
              }),
              expect.objectContaining({
                index: "45",
                name: "Температура",
                type: "BLOCK",
                rooms: [14]
              })
            ])
          }
        }
      }
    });
    
    // Verify we got the expected scenarios
    expect(result.result.scenario.list.scenarios).toHaveLength(4);
    expect(result.result.scenario.list.scenarios[0].index).toBe("SmoothBrightnessChange");
    expect(result.result.scenario.list.scenarios[1].index).toBe("44");
    expect(result.result.scenario.list.scenarios[2].index).toBe("45");
    expect(result.result.scenario.list.scenarios[3].index).toBe("2");
  });

  test("execute with different value types", async () => {
    // Test boolean value
    const boolResult = await sprut.execute("update", {
      accessoryId: 167,
      serviceId: 13,
      characteristicId: 15,
      control: { value: true, valueType: 'bool' }
    });
    expect(boolResult.isSuccess).toBe(true);

    // Test integer value
    const intResult = await sprut.execute("update", {
      accessoryId: 167,
      serviceId: 13,
      characteristicId: 15,
      control: { value: 50, valueType: 'int' }
    });
    expect(intResult.isSuccess).toBe(true);

    // Test string value
    const stringResult = await sprut.execute("update", {
      accessoryId: 167,
      serviceId: 13,
      characteristicId: 15,
      control: { value: "test string", valueType: 'string' }
    });
    expect(stringResult.isSuccess).toBe(true);
  });

  test("helper methods for device information", async () => {
    const mockAccessories = [
      {
        id: 1,
        name: "Device 1",
        roomId: 1,
        services: [
          {
            sId: 1,
            name: "Service 1",
            type: "Switch",
            characteristics: [
              {
                cId: 1,
                control: {
                  name: "On/Off",
                  type: "On",
                  write: true,
                  read: true,
                  value: { boolValue: false }
                }
              }
            ]
          }
        ]
      }
    ];

    // Test getDevicesByRoom
    const roomDevices = sprut.getDevicesByRoom(mockAccessories, 1);
    expect(roomDevices).toHaveLength(1);
    expect(roomDevices[0].id).toBe(1);

    // Test getControllableCharacteristics
    const controllable = sprut.getControllableCharacteristics(mockAccessories);
    expect(controllable).toHaveLength(1);
    expect(controllable[0]).toMatchObject({
      accessoryId: 1,
      serviceId: 1,
      characteristicId: 1,
      writable: true
    });

    // Test getDeviceInfo
    const deviceInfo = sprut.getDeviceInfo(mockAccessories, 1);
    expect(deviceInfo).not.toBeNull();
    expect(deviceInfo.id).toBe(1);
    expect(deviceInfo.name).toBe("Device 1");

    // Test getCharacteristicInfo
    const charInfo = sprut.getCharacteristicInfo(mockAccessories, 1, 1, 1);
    expect(charInfo).not.toBeNull();
    expect(charInfo.device.id).toBe(1);
    expect(charInfo.service.id).toBe(1);
    expect(charInfo.characteristic.id).toBe(1);
  });

  test("full system info retrieval", async () => {
    const systemInfo = await sprut.getFullSystemInfo();
    
    expect(systemInfo).toHaveProperty('isSuccess', true);
    expect(systemInfo).toHaveProperty('data');
    expect(systemInfo.data).toHaveProperty('hubs');
    expect(systemInfo.data).toHaveProperty('accessories');
    expect(systemInfo.data).toHaveProperty('rooms');
    expect(systemInfo.data).toHaveProperty('scenarios');
    expect(systemInfo.data).toHaveProperty('controllableDevices');
    expect(systemInfo.data).toHaveProperty('errors');
    
    expect(Array.isArray(systemInfo.data.hubs)).toBe(true);
    expect(Array.isArray(systemInfo.data.accessories)).toBe(true);
    expect(Array.isArray(systemInfo.data.rooms)).toBe(true);
    expect(Array.isArray(systemInfo.data.scenarios)).toBe(true);
    expect(Array.isArray(systemInfo.data.controllableDevices)).toBe(true);
    expect(Array.isArray(systemInfo.data.errors)).toBe(true);
  });

  test("list scenarios command", async () => {
    const result = await sprut.listScenarios();

    expect(result).toMatchObject({
      isSuccess: true,
      code: 0,
      message: "Success"
    });
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(4);
    expect(result.data[0]).toMatchObject({
      index: "SmoothBrightnessChange",
      name: "Плавное изменение яркости",
      type: "LOGIC",
      active: true,
      predefined: true
    });
    expect(result.data[1]).toMatchObject({
      index: "44",
      name: "Статистика датчиков",
      type: "LOGIC",
      active: true,
      predefined: false
    });
  });

  test("create scenario command", async () => {
    const result = await sprut.createScenario({
      type: "BLOCK",
      name: "New Test Scenario",
      desc: "A newly created test scenario",
      onStart: false,
      active: true,
      sync: false,
      data: ""
    });

    expect(result).toMatchObject({
      isSuccess: true,
      code: 0,
      message: "Success"
    });
    expect(result.data).toMatchObject({
      index: "3",
      name: "New Test Scenario",
      desc: "A newly created test scenario",
      type: "BLOCK",
      active: true,
      onStart: false,
      sync: false
    });
  });

  test("update scenario command", async () => {
    const testData = JSON.stringify({
      blockId: 0,
      targets: [{
        type: "code",
        code: "log.info(\"updated test\")\n"
      }]
    });

    const result = await sprut.updateScenario("3", testData);

    expect(result).toMatchObject({
      isSuccess: true,
      code: 0,
      message: "Success"
    });
    expect(result.data).toMatchObject({
      index: "3",
      name: "Updated Scenario",
      desc: "Updated scenario description",
      iconsThen: ["code"]
    });
  });

  test("get scenario command", async () => {
    const result = await sprut.getScenario("83");

    expect(result).toMatchObject({
      isSuccess: true,
      code: 0,
      message: "Success"
    });
    expect(result.data).toMatchObject({
      index: "83",
      name: "Test Scenario",
      type: "BLOCK",
      active: true
    });
  });

  test("delete scenario command", async () => {
    const result = await sprut.deleteScenario("92");

    expect(result).toMatchObject({
      isSuccess: true,
      code: 0,
      message: "Success"
    });
  });

  test("scenario validation errors", async () => {
    // Test missing scenario index for update
    await expect(
      sprut.updateScenario("", "some data")
    ).rejects.toThrow("Scenario index must be provided");

    // Test missing scenario data for update
    await expect(
      sprut.updateScenario("1", "")
    ).rejects.toThrow("Scenario data must be provided");
  });
});