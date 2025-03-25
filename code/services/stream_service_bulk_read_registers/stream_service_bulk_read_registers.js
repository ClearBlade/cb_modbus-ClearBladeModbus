/**
 * Type: Stream Service
 * Description: A service that does not have an execution timeout which allows for infinite execution of logic.
 * @param {CbServer.BasicReq} req
 * @param {string} req.systemKey
 * @param {string} req.systemSecret
 * @param {string} req.userEmail
 * @param {string} req.userid
 * @param {string} req.userToken
 * @param {boolean} req.is//logging
 * @param {[id: string]} req.params
 * @param {CbServer.Resp} resp
 */

/**
 * - Get each assets and perform Modbus Read(TCP or RTU) for register batch
 * - Send modbus read result along with registers batch to stream_service_normalizer
 */
function stream_service_bulk_read_registers(req, resp) {
    const isDebug = DEBUG_LOG.SS_BULK_READ_REGISTER;
    ClearBlade.init({ request: req });
    var messaging = ClearBlade.Messaging();
    var client = new MQTT.Client();
  
    /**
     * MQTT listner to update the assets cache
     * On adding row in asset table we get message here which update asset cache
     */
    client.subscribe(topics.SYNC_UPDATE_ASSET, updateAssetCache).catch(function (reason) {
      if (isDebug) {
        log('received ERROR on topic ' + topic + ': ' + reason);
      }
    });
  
    function updateAssetCache(topic, data) {
      const msg = JSON.parse(data.payload);
      if (isEmptyObject(msg) || !msg.type) {
        if (isDebug) {
          log('Missing parameters');
          logStdErr('Missing parameters');
        }
      }
      function getAdapterConfigCallback(err, results) {
        if (err) {
          if (isDebug) {
            log('error while getting adapter config ', err);
          }
        }
        if (!results || isEmptyArray(results)) {
          if (isDebug) {
            log('Updated asset type is not configured in adapter_config');
          }
          return;
        } else {
          function getAssetsCacheCallback(err, data) {
            if (err) {
              if (isDebug) {
                log('Error while getting asset data');
              }
            } else {
              if (isDebug) {
                log('Asset cache updated successfully with data : ', data);
              }
            }
          }
          const assetParams = {
            updateCache: true,
            adapterName: msg.type
          };
          getAssetsCache(assetParams, getAssetsCacheCallback);
        }
      }

      getAdapterConfig(
        {
          adapterName: msg.type,
          adapterType: adapterType.modbus
        },
        getAdapterConfigCallback
      );
    }
  
    /**
     * To process bulk read
     */
    client.subscribe(topics.bulkReadRegisters, onMessage).catch(function (reason) {
      if (isDebug) {
        log('received ERROR on topic ' + topic + ': ' + reason);
      }
    });
  
    function onMessage(topic, message) {
      if (isDebug) {
        log('received message on topic ' + topic + ': ' + message.payload);
      }
      processMessage(message.payload, topic);
    }
  
    function processMessage(msg, topic) {
      /**
       * Start here
       * We got message from stream_service_process_modbus_config as batch of registers based on register type
       * fetch data from message and execute 'getAssetsCache' first
       */
      msg = JSON.parse(msg);
      const readRegister = msg['readRegister'];
      const startingAddress = msg['startingAddress'];
      const length = msg['length'];
      const objectsForBulkRead = msg['objectsForBulkRead'];
  
      if (isDebug) {
        log('msg received', msg);
      }
      const adapterName = msg['adaptorName'];
  
      if (isDebug) {
        log(
          'ASSET TYPE:  ' +
            adapterName +
            '  Processing:  ' +
            readRegister +
            ':  Starting Adderss; ' +
            startingAddress +
            ',  Length:  ' +
            length
        );
        logStdErr(
          'ASSET TYPE:  ' +
            adapterName +
            '  Processing:  ' +
            readRegister +
            ':  Starting Adderss; ' +
            startingAddress +
            ',  Length:  ' +
            length
        );
      }
      if (!readRegister || !startingAddress || length <= 0 || isEmptyObject(objectsForBulkRead)) {
        if (isDebug) {
          log('Missing parameters');
        }
        resp.error('Missing parameters');
      }
  
      /**
       * Iterate through each asset and get modbus configuration like ip and port or Modbus RTU config
       * Send register batch info and modbus config to  'performReadRegisterAction' for reading modbus data
       */
      function getAssetsCallback(err, assets) {
        if (err) {
          if (isDebug) {
            log('Missing parameters');
            logStdErr('Missing parameters');
          }
          resp.error('Error while getting asserts');
        }
  
        if (isEmptyArray(assets)) {
          if (isDebug) {
            log('No assets found');
            logStdErr('No assets found');
          }
        }
        const state = {};
        state['objects'] = objectsForBulkRead;
  
        const actions = assets.map(function (asset) {
          state['asset'] = asset;
          if (isDebug) {
            log('in MAP - asset:  ' + JSON.stringify(asset));
          }
  
          return performReadRegisterAction(JSON.parse(asset.custom_data), readRegister, startingAddress, length, state);
        });
  
        if (isEmptyArray(actions)) {
          if (isDebug) {
            log('No assets found with required config');
          }
          return;
        }
  
        /**
         * Recive modbus TCP read result and send modbus read data along with batch of registers
         *  to stream_service_normalizer
         */
        Promise.all(actions)
          .then(function (result) {
            if (isDebug) {
              log('-->>Final Modbus Read Results<<--');
              logStdErr('-->>Final Modbus Read Results<<--');
            }
  
            if (isDebug) {
              log(JSON.stringify(result));
              logStdErr(JSON.stringify(result));
            }
            const isModbusRTURead = result.some(function (readRes) {
              return readRes == MODBUS_RTU_READ_WRITE_INITIATED;
            });
            if (!isModbusRTURead) {
              if (isDebug) {
                log('Publishing on TOPIC:  ' + topics.requestNormalizer);
                log('----------------------------------', result);
                logStdErr('Publishing on TOPIC:  ' + topics.requestNormalizer);
                logStdErr('----------------------------------', result);
              }
              messaging.publish(topics.requestNormalizer, JSON.stringify(result));
            } else {
              if (isDebug) {
                log('Modbus RTU read initiated');
              }
            }
          })
          .catch(function (err) {
            if (isDebug) {
              log('Error while getting Modbus data');
              log('error:  ', err);
            }
          });
      }
      /**
       * Actual start here,
       * Fetch assets which type is equals to adapterName given
       */
      getAssetsCache({ adapterName }, getAssetsCallback);
    }
  }
  