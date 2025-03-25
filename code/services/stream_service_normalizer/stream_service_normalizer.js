/**
 * Type: Stream Service
 * Description: A service that does not have an execution timeout which allows for infinite execution of //logic.
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
 * - Get conresponding value of register
 * - Get actual value of register based on its data type
 * - Apply modfier and filters configured for register
 * - Send actual/Normalized value to downstream topic
 */
function stream_service_normalizer(req, resp) {
    const isDebug = DEBUG_LOG.SS_NORMALIZER;
    ClearBlade.init({ request: req });
    var messaging = new MQTT.Client();
    messaging.subscribe(topics.requestNormalizer, onMessage).catch(function (reason) {
      resp.error('failed to subscribe: ' + reason.message);
    });
  
    function onMessage(topic, message) {
      if (isDebug) {
        log('Received message on topic ' + topic + ': ' + message.payload);
      }
      processMessage(message.payload, topic);
    }
  
    function processMessage(msg, topic) {
      const assetsResults = JSON.parse(msg);
      log(' processMessage Mesg: ', assetsResults);
      if (!assetsResults || isEmptyArray(assetsResults)) {
        if (isDebug) {
          log('No data to parse in message:  ' + JSON.stringify(assetsResults));
          logStdErr('No data to parse in message:  ' + JSON.stringify(assetsResults));
        }
        resp.error('No data to parse in message:  ' + JSON.stringify(assetsResults));
      }
  
      assetsResults.forEach(function (assetResult) {
        if (isDebug) {
          log('Asset result', assetResult);
          logStdErr('Asset result', assetResult);
        }
        const downStreamRegisters = [];
        const filterRegisters = [];
        const results = assetResult['result'];
        const objects = assetResult['objects'];
        const asset = assetResult['asset'];
        if ((isEmptyArray(results) || isEmptyObject(objects), isEmptyObject(asset))) {
          if (isDebug) {
            log('ERROR: Missing required information(result, objects, asset) in message to process');
            logStdErr('ERROR: Missing required information(result, objects, asset) in message to process');
          }
          resp.error('ERROR: Missing required information(result, objects, asset) in message to process');
        }
        const objectsAddresses = Object.keys(objects);
        const startAdd = objectsAddresses[0];
        if (isDebug) {
          log('------>  PROCESSING ADDRESSES:  ', objectsAddresses);
        }
  
        /**
         * - Iterate through each address
         * - Calculate and Fetch its conresponding modbus value from
         *   results(array having all modbus read result of register batch)
         * - Normalize modbus value by 'getNormalizedValue'
         */
        objectsAddresses.forEach(function (address) {
          if (isDebug) {
            log('----------' + address + '-------');
          }
  
          var start = calculateDiff(Number(address), Number(startAdd));
          if (isDebug) {
            log('------>  start:  ', start);
          }
  
          if (start < 0) {
            if (isDebug) {
              log(
                'ERROR: Start address is invalid(negative)  ',
                address,
                ' - value offset found at index:  ',
                start,
                ' startingAddress:  ',
                startAdd
              );
            }
            return;
          }
  
          var objectInfo = objects[address];
          objectInfo.length = Number(objectInfo.length);
          var end = start + objectInfo.length;
          if (end > results.length) {
            if (isDebug) {
              log('ERROR: End address in invalid!!, objectInfo.length:  ', objectInfo.length);
              log(address, ' - ending address:  ', end, ' > ', results.length);
              log('results:  ', results);
            }
            return;
          }
  
          var objModbusValue = results.slice(start, end);
  
          if (isDebug) {
            log(start + ' : ' + end);
            log(objModbusValue);
            log('----------');
          }
  
          var objInfoWithAdd = Object.assign(objectInfo, { address });
  
          if (isDebug) {
            log('processMessage.objectInfoWithAdd:  ', objInfoWithAdd);
            logStdErr('processMessage.objectInfoWithAdd:  ', objInfoWithAdd);
          }
  
          var value = getNormalizedValue(objModbusValue, objInfoWithAdd);
          if (isDebug) {
            log('NORMALIZED VALUE:  ==================================.   ', address, ':', value);
          }
  
          objInfoWithAdd.value = value;
          // Check if register has filter configured and add for in array to process
          if (objInfoWithAdd.hasOwnProperty(filter.processDeltaOnly) || objInfoWithAdd.hasOwnProperty(filter.minUpdate)) {
            filterRegisters.push(objInfoWithAdd);
            return;
          }
  
          downStreamRegisters.push(objInfoWithAdd);
        });
        if (downStreamRegisters.length > 0) {
          sendResultDataDownStream(downStreamRegisters, asset.id, asset.type);
        }
  
        //Check if register has filter to process and perform filters(processDeltaOnly, minUpdate)
        if (filterRegisters.length > 0) {
          const filterResults = filterRegisters.map(function (objectInfo) {
            return applyFilter({ objectInfo, asset });
          });
          Promise.all(filterResults)
            .then(function (result) {
              if (isDebug) {
                log(result);
              }
              sendResultDataDownStream(result, result[0].assetId, result[0].assetType);
            })
            .catch(function (err) {
              if (isDebug) {
                log(err);
              }
              resp.error('Exception');
            });
        }
      });
  
      /**
       * Send message to downstram topics with register info and its value
       * Consider only register which are approved from filters
       */
      function sendResultDataDownStream(registersData, assetId, assettype) {
        const downStreamRegistersFiltered = registersData.filter(function (register) {
          return register.hasOwnProperty('value') && register.value != ELIMINATE_REGISTER;
        });
  
        if (isEmptyArray(downStreamRegistersFiltered)) {
          return;
        }
  
        var updateMessage = {};
        updateMessage.id = assetId;
        updateMessage.type = assettype;
  
        var custom_data = {};
        downStreamRegistersFiltered.forEach(function (assetRecord) {
          if (isDebug) {
            log(assetRecord);
          }
          custom_data[assetRecord.attribute_name] = assetRecord.value;
        });
  
        //Don't publish if there is no custom data
        if (Object.keys(custom_data).length == 0) {
          return;
        }
  
        updateMessage.custom_data = custom_data;
        updateMessage.last_updated = new Date().toISOString();
  
        if (isDebug) {
          log('-------------Message Publish-----------');
          log('Topics:');
        }
        var topic = util.format(topics.EDGE_TO_ASSET, assetId);
        if (isDebug) {
          log(topic);
        }
        messaging.publish(topic, JSON.stringify(updateMessage));
  
        topic = util.format(topics.EDGE_TO_HISTORY, assetId);
        if (isDebug) {
          log(topic);
        }
        messaging.publish(topic, JSON.stringify(updateMessage));
  
        topic = util.format(topics.EDGE_TO_LIVE, assetId);
        if (isDebug) {
          log(topic);
        }
        messaging.publish(topic, JSON.stringify(updateMessage));
    
        if (isDebug) {
          log('Message : \n' + JSON.stringify(updateMessage));
        }
      }
    }
  }
  