const isDebugRead = DEBUG_LOG.SS_BULK_READ_REGISTER;
var executeCommand = {};
var modbusClients = {};

/**
 * ============================== MODBUS READ ===========================
 */

/**
 * Modbus TCP read for each register type
 */
executeCommand[registerType.holdingRegister] = function (client, startAdd, length) {
  if (isDebugRead) {
    log('Execute ' + registerType.holdingRegister + ' : Start :' + startAdd + ', Lenght: ' + length);
  }
  return new Promise(function (fulfill, rej) {
    client.readHoldingRegisters(startAdd, length, function (err, data) {
      if (err) {
        if (isDebugRead) {
          log(err);
        }
        rej(err);
      } else {
        if (isDebugRead) {
          log(data.data);
        }
        fulfill(data.data);
      }
    });
  });
};

executeCommand[registerType.coilRegister] = function (client, startAdd, length) {
  if (isDebugRead) {
    log('Execute ' + registerType.coilRegister + ' : Start :' + startAdd + ', Lenght: ' + length);
  }
  return new Promise(function (fulfill, rej) {
    client.readCoils(startAdd, length, function (err, data) {
      if (err) {
        if (isDebugRead) {
          log(err);
        }
        rej(err);
      } else {
        if (isDebugRead) {
          log(data.data);
        }
        fulfill(data.data);
      }
    });
  });
};

executeCommand[registerType.inputRegister] = function (client, startAdd, length) {
  if (isDebugRead) {
    log('Execute ' + registerType.inputRegister + ' : Start :' + startAdd + ', Lenght: ' + length);
  }
  return new Promise(function (fulfill, rej) {
    client.readInputRegisters(startAdd, length, function (err, data) {
      if (err) {
        if (isDebugRead) {
          log(err);
        }
        rej(err);
      } else {
        if (isDebugRead) {
          log(data.data);
        }
        fulfill(data.data);
      }
    });
  });
};

executeCommand[registerType.discreteInputsRegister] = function (client, startAdd, length) {
  if (isDebugRead) {
    log('Execute ' + registerType.discreteInputsRegister + ' : Start :' + startAdd + ', Lenght: ' + length);
  }
  return new Promise(function (fulfill, rej) {
    client.readDiscreteInputs(startAdd, length, function (err, data) {
      if (err) {
        if (isDebugRead) {
          log(err);
        }
        rej(err);
      } else {
        if (isDebugRead) {
          log(data.data);
        }
        fulfill(data.data);
      }
    });
  });
};

function getRTUBufferedParams(config) {
  const params = {};
  if (config.baudRate) params.baudRate = Number(config.baudRate);
  if (config.stopBits) params.stopBits = Number(config.stopBits);
  if (config.dataBits) params.dataBits = Number(config.dataBits);
  if (config.parity) params.parity = config.parity;
  return params;
}

/**
 * In modbus RTU we cache register information for which we are performing read/write so it can be available in 'stream_service_process_modbus_RTU_response'
 * It is use for state managment
 */
function cacheRTUReadState(registerType, startAdd, length, state) {
  const cacheParams = {
    cache_name: CACHE.MODBUS_RTU_READ_STATE,
    key: registerType + '' + startAdd + '' + length,
    data: state
  };
  setValueForCache(cacheParams, function (err, data) {
    if (err) {
      if (isDebugRead) {
        log('Error while adding value in cache for params : ' + JSON.stringify(cacheParams));
      }
    } else {
      if (isDebugRead) {
        log('Added value in cache for params : ' + JSON.stringify(cacheParams));
      }
    }
  });
}

/**
 * Modbus read/write for Modbus RTU
 *  We are sending MQTT message for modbus RTU read or write and result is recived on 'stream_service_process_modbus_RTU_response'
 */
function performReadWriteForModbusRTU(registerType, startAdd, length, state, value) {
  // cache state data while RTU reading
  if (registerType != registerType.register) {
    cacheRTUReadState(modbusRTURegister[registerType], startAdd, length, state);
  }

  var messaging = ClearBlade.Messaging();
  const modbusReadWritePayload = {
    //ModbusHost: '192.168.3.129:502', //may 2023 ryan added
    FunctionCode: modbusRTURegister[registerType],
    StartAddress: Number(startAdd),
    AddressCount: Number(length)
  };
  if (value !== null) {
    modbusReadWritePayload['FunctionCode'] = modbusRTUWriteRegister[registerType];
    modbusReadWritePayload.Data = value;
  }
  messaging.publish(topics.MODBUS_RTU_READ_WRITE_REQUEST, JSON.stringify(modbusReadWritePayload));
  if (isDebugRead) {
    log('MODUBS RTU MESSAGE SENT TOPIC' + topics.MODBUS_RTU_READ_WRITE_REQUEST + ' Payload:');
    log(modbusReadWritePayload);
  }
}

/**
 * Based on modbusConfig we perform modbus read either for ModbuRTU or TCP
 */
function performReadRegisterAction(modbusConfig, command, startAdd, length, state) {
  var clientName =
    modbusConfig.hasOwnProperty('ipAddress') && modbusConfig.hasOwnProperty('port')
      ? modbusConfig.ipAddress + '_' + modbusConfig.port
      : 'default';

  return new Promise(function (fulfill, rej) {
    if (!modbusClients[clientName]) {
      if (isDebugWrite) {
        log('Creating new ModbusRTU client');
      }
      modbusClients[clientName] = new ModbusRTU();
    }

    if (isDebugRead) {
      log('>>performReadRegisterAction');
      log('modbus client name:  ', clientName);
      log('modbusConfig:  ', modbusConfig);
      log('command:  ', command);
      log('Start Address', startAdd, ', Length:  ', length, ', state:  ', state);
    }

    // if modbus config has ip or port perform modbus read for TCP else perform read for RTU
    if (modbusConfig.hasOwnProperty('ipAddress') && modbusConfig.hasOwnProperty('port')) {
      if (modbusClients[clientName].isOpen) {
        if (isDebugWrite) {
          log('Port already opened. Invoking clientConnectCallback');
        }
        clientConnectCallback(false, 'port already opened');
      } else {
        if (isDebugWrite) {
          log('TCP client not open. Calling connect method');
        }
        modbusClients[clientName].connectTCP(
          modbusConfig.ipAddress,
          { port: Number(modbusConfig.port) },
          clientConnectCallback
        );
      }
    } else {
      if (isDebugRead) {
        log('PROCESSING MODBUS RTU');
      }
      performReadWriteForModbusRTU(command, startAdd, length, state, null);
      fulfill(MODBUS_RTU_READ_WRITE_INITIATED);
    }

    function clientConnectCallback(err, result) {
      if (isDebugRead) {
        log('>>clientConnectCallback');
        log('Execute - command:  ', command);
      }

      if (err) {
        if (isDebugRead) {
          log('error while connecting modbus client');
        }
        rej(err);
        return;
      }

      modbusClients[clientName].setID(modbusConfig.modBus_device_id);
      executeCommand[command](modbusClients[clientName], startAdd, length)
        .then(function (readResult) {
          if (isDebugRead) {
            log('Success read');
            log(readResult);
          }
          var result = { result: readResult };
          if (!isEmptyObject(state)) result = Object.assign(result, state);
          fulfill(result);
        })
        .catch(function (err) {
          if (isDebugRead) {
            log('fail read');
            log(err);
          }
          var result = { error: err };
          if (!isEmptyObject(state)) result = Object.assign(result, state);
          rej(result);
        });
    }
  });
}

/**
 * ============================== MODBUS WRITE ===========================
 */

const isDebugWrite = DEBUG_LOG.SS_PERFORM_ACTION;
var executeWriteCommand = {};

/**
 * Modbus TCP write for each register type
 */
executeWriteCommand[registerType.coilRegister] = function (client, startAdd, value) {
  if (isDebugWrite) {
    log('Execute ' + registerType.coilRegister + ' : Start :' + startAdd + ', value: ' + value);
  }

  return new Promise(function (fulfill, rej) {
    client.writeCoil(startAdd, value, function (err, data) {
      if (isDebugWrite) {
        log('Modbus write to ', registerType.coilRegister, ' result -------- err:  ', err, ' data:  ', data);
      }
      if (err) {
        if (isDebugWrite) {
          log(err);
        }
        rej(err);
      } else {
        if (isDebugWrite) {
          log(data);
        }
        fulfill(data);
      }
    });
  });
};

executeWriteCommand[registerType.register] = function (client, startAdd, value) {
  if (isDebugWrite) {
    log('Execute ' + registerType.register + ' : Start :' + startAdd + ', value: ' + value);
  }

  return new Promise(function (fulfill, rej) {
    client.writeRegister(startAdd, value, function (err, data) {
      if (isDebugWrite) {
        log('Modbus write to ', registerType.register, ' result -------- err:  ', err, ' data:  ', data);
      }
      if (err) {
        if (isDebugWrite) {
          log(err);
        }
        rej(err);
      } else {
        if (isDebugWrite) {
          log(data);
        }
        fulfill(data);
      }
    });
  });
};

/**
 * Based on modbusConfig we perform modbus write either for ModbuRTU or TCP
 */
function performWriteRegisterAction(modbusConfig, commandRegType, startAdd, length, value, state) {
  var clientName =
    modbusConfig.hasOwnProperty('ipAddress') && modbusConfig.hasOwnProperty('port')
      ? modbusConfig.ipAddress + '_' + modbusConfig.port
      : 'default';

  return new Promise(function (fulfill, rej) {
    if (!modbusClients[clientName]) {
      if (isDebugWrite) {
        log('Creating new ModbusRTU client');
      }
      modbusClients[clientName] = new ModbusRTU();
    }

    if (isDebugWrite) {
      log('>>performWriteRegisterAction');
      log('modbus client name:  ', clientName);
      log('modbusConfig:  ', modbusConfig);
      log('command:  ', commandRegType);
      log('Start Address', startAdd, ', Length:  ', length, ', state:  ', state);
    }

    // If modbus config has ip and port perform modbus TCP write else send message for modbus RTU write
    if (modbusConfig.hasOwnProperty('ipAddress') && modbusConfig.hasOwnProperty('port')) {
      if (modbusClients[clientName].isOpen) {
        if (isDebugWrite) {
          log('Port already opened. Invoking clientConnectCallback');
        }
        clientConnectCallback(false, 'port already opened');
      } else {
        if (isDebugWrite) {
          log('TCP client not open. Calling connect method');
        }
        modbusClients[clientName].connectTCP(
          modbusConfig.ipAddress,
          { port: Number(modbusConfig.port) },
          clientConnectCallback
        );
      }
    } else {
      performReadWriteForModbusRTU(commandRegType, startAdd, length, state, value);
      fulfill(MODBUS_RTU_READ_WRITE_INITIATED);
      return;
    }

    function clientConnectCallback(err, result) {
      if (isDebugWrite) {
        log('clientConnectCallback err:', err, ' result: ', result);
      }

      if (err) {
        if (isDebugWrite) {
          log('error while connecting modbus client:  ', err);
        }
        rej(err);
        return;
      }

      modbusClients[clientName].setID(modbusConfig.modBus_device_id);

      executeWriteCommand[registerType.register](modbusClients[clientName], startAdd, value)
        .then(function (writeResult) {
          if (isDebugWrite) {
            log('Successful write:  ', writeResult);
          }

          const result = { result: writeResult };
          if (!isEmptyObject(state)) resutl = Object.assign(result, state);
          fulfill(result);
        })
        .catch(function (err) {
          if (isDebugWrite) {
            log('Error on write:  ', err);
          }

          const result = { error: err };
          if (!isEmptyObject(state)) resutl = Object.assign(result, state);
          rej(result);
        });
    }
  });
}
