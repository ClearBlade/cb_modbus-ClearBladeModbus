/**
 * Type: Stream Service
 * Description: A service that does not have an execution timeout which allows for infinite execution of logic.
 * @param {CbServer.BasicReq} req
 * @param {string} req.systemKey
 * @param {string} req.systemSecret
 * @param {string} req.userEmail
 * @param {string} req.userid
 * @param {string} req.userToken
 * @param {boolean} req.isLogging
 * @param {[id: string]} req.params
 * @param {CbServer.Resp} resp
 */

/**
 * This stream service excutes when we perform any action from UI like(Start, Stop, Restart Panel etc)
 * - Get adapter config for control key triggered from UI
 * - Check precondition configured for control key
 * - If precondition satisfy then get write config and perform modbus write
 * - Send message to bulk read stream service to perform read after write to reflact change in UI
 */
function stream_service_perform_actions(req, resp) {
    const isDebug = DEBUG_LOG.SS_PERFORM_ACTION;
    ClearBlade.init({ request: req });
    const edgeId = ClearBlade.edgeId() || 'edge';
    const TOPIC = util.format(topics.TO_EDGE, edgeId);
    var client = new MQTT.Client();
  
    client.subscribe(TOPIC, onMessage).catch(function (reason) {
      client.publish('error', 'Fail to subscribe : ' + reason.message);
      resp.error('failed to subscribe: ' + reason.message);
    });
    function onMessage(topic, message) {
      if (isDebug) {
        log('received message on topic ' + topic + ': ' + message.payload);
      }
      client.publish('success', 'Message recived topic' + topic + ' :  ' + message);
      processMessage(message.payload, topic);
    }
  
    function processMessage(msg, topic) {
      msg = JSON.parse(msg);
      const asset = msg.asset || {};
      if (isDebug) {
        log('asset customData: ', asset.custom_data);
      }
      if (isEmptyObject(asset) || isEmptyObject(asset.custom_data) || !asset.id || !asset.type) {
        if (isDebug) {
          log("ERROR: Invalid message input, don't have asset info");
        }
        sendErrorMessage("ERROR: Invalid message input, don't have asset info", updateMsg);
        resp.error("Invalid message input, don't have asset info");
      }
  
      const controlKey = msg.control.id;
      if (isDebug) {
        log(controlKey);
      }
  
      const updateMsg = {
        last_updated: new Date().toISOString(),
        id: msg.asset.id,
        type: msg.asset.type,
        custom_data: {}
      };
      var configJson = {};
      const readAfterWriteRegisters = [];
      var adapterName;
  
      function sendUpdateMessage() {
        if (isDebug) {
          log('>>sendUpdateMessage');
        }
        updateMsg.custom_data['Feedback'] = 'COMMAND SUCCESSFUL';
        updateMsg.custom_data['Command Ordered'] = msg.asset.custom_data['Command Ordered']; //use the timestamp command was ordered from platform
        updateMsg.custom_data['Command Executed'] = new Date().toISOString();
        updateMsg.custom_data['Executed By'] = msg.user.email;
        var topic = util.format(topics.EDGE_TO_ASSET, msg.asset.id);
        if (isDebug) {
          log('topic:  ', topic);
          log('msg:  ', updateMsg);
        }
        //publish to IA topics
        client.publish(topic, JSON.stringify(updateMsg));
        if (isDebug) {
          log('Success Message Sent!');
        }
  
        //publish to LIVE topic relayed to plaltform for UI
        topic = util.format(topics.EDGE_TO_LIVE, msg.asset.id);
        client.publish(topic, JSON.stringify(updateMsg));
        if (isDebug) {
          log('Success Message Sent!');
        }
      }
  
      // To reflect write changes in UI send message to bulkReadRegisters stream service
      function sendReadAfterWriteMessage() {
        readAfterWriteRegisters.forEach(function (regConfig) {
          const msg = getBulkReadRegMsgPayload(regConfig, adapterName);
          if (isDebug) {
            log('-------Read after Write message');
            log(msg);
          }
          client.publish(topics.bulkReadRegisters, JSON.stringify(msg));
        });
      }
  
      function handleWriteSuccess() {
        if (isDebug) {
          log('Write Success');
        }
        sendUpdateMessage();
        sendReadAfterWriteMessage();
        if (isDebug) {
          log('Done all');
        }
        resp.success('Success');
      }
  
      function sendErrorMessage(err) {
        updateMsg.custom_data['Feedback'] = 'COMMAND Failed : ' + JSON.stringify(err);
        client.publish(topics.EDGE_TO_ASSET, JSON.stringify(updateMsg)); //publish to IA topics
        client.publish(topics.EDGE_TO_LIVE, JSON.stringify(updateMsg)); //publish to LIVE topic relayed to plaltform for UI
        if (isDebug) {
          log('Error Message Sent!');
          log('msg:  ', updateMsg);
        }
        resp.error(err);
      }
  
      /**
       * If procondition satisfy then get write config of control key from adapter config result
       * Perform modbus write of configured write config
       */
      function preConditionResult(preConditionRes, controlCommandInfo) {
        if (preConditionRes == PRECONDITION_REJECTED) {
          sendErrorMessage('PRE-Condition Rejected:  COMMAND NOT ALLOWED');
        } else {
          const registerType = controlCommandInfo.registerType;
          const writes = controlCommandInfo.message;
          if (isDebug) {
            log('-----------');
            log(registerType);
            log(writes);
          }
          const writesPromises = writes.map(function (writeParams) {
            if (isDebug) {
              log('writeParams: ', writeParams);
            }
            const registerConfig = getRegisterConfig(configJson, registerType, writeParams.address);
  
            // Geting register information for read after write and write value based on data type
            if (isDebug) {
              log('===>Register Config', registerConfig);
            }
            if (isEmptyObject(registerConfig) || !registerConfig.dataType) {
              if (isDebug) {
                log('Config not found for Register type ' + registerType + ' address ' + writeParams.address);
              }
              sendErrorMessage('Config not found for Register type ' + registerType + ' address ' + writeParams.address);
              return;
            }
  
            if (writeParams.requestedValue && !msg.custom_data && !msg.custom_data.value) {
              if (isDebug) {
                log('requestedValue is true and ' + 'Control value does not exist in message for ' + controlKey);
              }
  
              return Promise.reject(
                'requestedValue is true and ' + 'Control value does not exist in message for ' + controlKey
              );
            }
            if (writeParams.requestedValue) {
              writeParams.value = msg.custom_data.value;
            }
  
            if (writeParams.value) {
              writeParams.value = getWriteNormalizedValue(writeParams, registerConfig);
  
              if (isDebug) {
                log('writeParams:  ', writeParams);
              }
            } else {
              return Promise.reject('Value is not provided for ' + controlKey);
            }
            if (isDebug) {
              log(
                'about to execute perfromWriteRegisterAction \nasset.custom_data',
                asset.custom_data,
                '  registerType:  ',
                registerType,
                ' \nwriteParams.address:  ',
                writeParams.address,
                ' \nwriteParams.value:  ',
                writeParams.value
              );
            }
  
            readAfterWriteRegisters.push(registerConfig);
  
            // We must inspect TYPE of value and only convert the 32Float a before
            // Convert to a 32 byte float (IEEE 754) before sending.
            if (registerConfig.dataType == dataType['32Float']) {
              if (isDebug) {
                log('value' + writeParams.value);
              }
              var farray = new Float32Array([writeParams.value]);
              writeParams.value = new Int16Array(farray.buffer);
            }
  
            return performWriteRegisterAction(
              asset.custom_data,
              registerType,
              writeParams.address,
              registerConfig.length,
              writeParams.value,
              {}
            );
          });
  
          Promise.all(writesPromises)
            .then(function (result) {
              if (isDebug) {
                log('final write result');
              }
              if (isDebug) {
                log('results:  ', result);
              }
              handleWriteSuccess();
            })
            .catch(function (err) {
              if (isDebug) {
                log('In Error promise all' + JSON.stringify(err));
              }
              sendErrorMessage(JSON.stringify(err));
            });
        }
      }
  
      /**
       * - Get command information from adapter config by controlkey triggered from UI
       * - Check for precondition if not satisfy then reject exection of controlkey
       * - If precondition satisfy then perform action
       */
      function getAdapterConfigCallback(err, result) {
        if (isDebug) {
          log('Results:  ', result);
        }
        if (err) {
          if (isDebug) {
            log('Error while fetching config from DB');
          }
          sendErrorMessage('Error while fetching config from DB');
        }
  
        if (!result || isEmptyArray(result) || isEmptyString(result[0].adapter_settings)) {
          if (isDebug) {
            log('Config not found in DB');
          }
          sendErrorMessage('Config not found in DB');
        } else {
          configJson = result[0].adapter_settings;
          adapterName = result[0].adapter_name;
          if (isDebug) {
            log('adapter_config:  ', configJson);
          }
  
          configJson = JSON.parse(configJson);
          assetType = result[0].adapter_name;
          if (
            !configJson.hasOwnProperty('actions') ||
            isEmptyObject(configJson.actions) ||
            !configJson.actions.hasOwnProperty('commands') ||
            isEmptyObject(configJson.actions.commands) ||
            isEmptyObject(configJson.actions.commands[controlKey])
          ) {
            if (isDebug) {
              log("ERROR: Invalid Config, Doesn't have action or commands");
            }
            sendErrorMessage("Invalid Config, Doesn't have action or commands");
          }
  
          const commands = configJson.actions.commands;
          if (isDebug) {
            log('commands:  ', commands);
          }
  
          const controlCommandInfo = commands[controlKey];
          if (isDebug) {
            log('controlCommandInfo:  ', controlCommandInfo);
          }
  
          if (!controlCommandInfo.registerType || isEmptyArray(controlCommandInfo.message)) {
            if (isDebug) {
              log("ERROR: Invalid Config, Doesn't have enough info in config");
            }
            sendErrorMessage("Invalid Config, Doesn't have enough info in config");
          } else {
            const actionPreConditions = controlCommandInfo.preConditions;
            if (isDebug) {
              log('actionPreConditions:  ', actionPreConditions);
            }
  
            if (!actionPreConditions || isEmptyArray(actionPreConditions)) {
              if (isDebug) {
                log('Skip precond processing');
              }
              preConditionResult(PRECONDITION_APPROVE, controlCommandInfo);
            } else {
              const preCondsPromises = actionPreConditions.map(function (actionPreCondition) {
                return checkPreConditions(asset.custom_data, actionPreCondition);
              });
  
              Promise.all(preCondsPromises)
                .then(function (result) {
                  if (isDebug) {
                    log('Check precondition Final result');
                    log(result);
                  }
                  const preCondResult =
                    result.length > 0 && result.indexOf(PRECONDITION_REJECTED) >= 0
                      ? PRECONDITION_REJECTED
                      : PRECONDITION_APPROVE;
  
                  if (isDebug) {
                    log('pre-condition result:  ', preCondResult, ' controlCommandInfo:  ', controlCommandInfo);
                  }
                  preConditionResult(preCondResult, controlCommandInfo);
                })
                .catch(function (err) {
                  if (isDebug) {
                    log('Error: failed in Promise processing pre-conditionns - ', err);
                  }
                  preConditionResult(PRECONDITION_REJECTED, controlCommandInfo);
                });
            }
          }
        }
      }
  
      // Start here, Get adapter config
      getAdapterConfigCache(asset, true, getAdapterConfigCallback);
    }
  }
  