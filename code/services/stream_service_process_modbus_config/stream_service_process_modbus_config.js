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
 * Main purpose this stream service :
 * - Fetch adapter config data which adapter_type is "Modbus"
 * - Prepare a batch of register based on register type and maxReadLenght
 * - set polling based on frequency configured
 */
function stream_service_process_modbus_config(req, resp) {
    const isDebug = DEBUG_LOG.SS_PROCESS_MODBUS_CONFIG;
    var cbClient;
    try {
      cbClient = new MQTT.Client();
    } catch (e) {
      resp.error('failed to init cb client: ' + e);
    }
  
    cbClient.subscribe(topics.TRIGGER_ADAPTER_CONFIG, onAdapterConfigChange);
  
    /**
     * We have trigger on adapter_config table which send message
     * on add or delete rows
     * On receiving message we are restaring this service to process latest config
     */
    function onAdapterConfigChange(topic, msg) {
      resp.success('adapter_config row added or updated, Restart service!');
    }
  
    init();
  
    function init() {
      /**
       * - Iterate through each register of register type and make a batch of registers which total
       *   address length is less than maxReadLength.
       * - Each batch total length must be less than max read length
       * - Send each batch to 'stream_service_bulk_read_registers' for modbus read
       */
      function processAttribute(frequency, readRegister, objectsToRead, maxReadLength, adapterName) {
        // fetch all the ASSETS from the asset collection where they type matches the DEVICE_TYPE
        const objectsStartAddresses = Object.keys(objectsToRead);
        var startingAddress = objectsStartAddresses[0];
        if (isDebug) {
          log('startingAddress : ' + startingAddress);
        }
        var calculatedLength = 0;
        const objectsForBulkRead = {};
        objectsStartAddresses.forEach(function (objStartAdd, index) {
          const objAttributes = objectsToRead[objStartAdd];
          calculatedLength = calculateLength(startingAddress, objStartAdd, objAttributes);
          if (isDebug) {
            log(startingAddress + ' : ' + objStartAdd);
            log('Length: ' + calculatedLength);
          }
          if (calculatedLength < 0) {
            if (isDebug) {
              log('ERROR: Object address ' + objStartAdd + 'is not in order');
            }
            return;
          }
  
          objectsForBulkRead[objStartAdd] = objAttributes;
          if (calculatedLength <= maxReadLength) {
            // continue iterating till calculatedLength is less then maxReadLength
            return;
          }
          if (isDebug) {
            log('Exceed Length ' + calculatedLength + ' : maxReadLength  ' + maxReadLength);
          }
          // Remove current object in bulk read as current obj exceed maxReadLenght
          const previousStartAdd = objectsStartAddresses[--index];
          if (isDebug) {
            log('--------------------');
            log(startingAddress + ' : ' + previousStartAdd);
          }
          const length = calculateLength(startingAddress, previousStartAdd, objectsToRead[previousStartAdd]);
          if (isDebug) {
            log('Length: ' + length);
            log('--------------------');
          }
          delete objectsForBulkRead[objStartAdd];
          if (isDebug) {
            log('In');
            log({ readRegister, startingAddress, length, objectsForBulkRead, adaptorName: adapterName });
          }
          cbClient.publish(
            topics.bulkReadRegisters,
            JSON.stringify({ readRegister, startingAddress, length, objectsForBulkRead, adaptorName: adapterName })
          );
          startingAddress = objStartAdd;
          calculatedLength = objAttributes.length;
          objectsForBulkRead = {};
          objectsForBulkRead[objStartAdd] = objAttributes;
        });
  
        if (isDebug) {
          log({ readRegister, startingAddress, length: calculatedLength, objectsForBulkRead, adaptorName: adapterName });
        }
        //Why are we doing a second publish??
        cbClient.publish(
          topics.bulkReadRegisters,
          JSON.stringify({
            readRegister,
            startingAddress,
            length: calculatedLength,
            objectsForBulkRead,
            adaptorName: adapterName
          })
        );
        setAutoPollByRegisterType(frequency, readRegister, objectsToRead, maxReadLength, adapterName);
      }
  
      /**
       * Here We are doing pooling based on frequency for each register type and send each
       * register data for 'processAttribute'
       */
      function setAutoPollByRegisterType(frequency, readRegister, objectsToRead, maxReadLength, adapterName) {
        setTimeout(
          processAttribute,
          frequency * 1000,
          frequency,
          readRegister,
          objectsToRead,
          maxReadLength,
          adapterName
        );
      }
  
      /**
       * Each frequency data has "command" group by register type
       * and it has register information that needs to read
       * Here we are grouping register information for each register type and send to 'setAutoPollByRegisterType'
       */
      function processFrequency(frequencyData, maxReadLength, adapterName) {
        const frequency = frequencyData.frequency;
        if (!frequencyData.hasOwnProperty('commands') || isEmptyObject(frequencyData.commands)) {
          if (isDebug) {
            log("ERROR: Config doesn't have attributes");
          }
        }
  
        const commands = frequencyData.commands;
        const readRegisters = Object.keys(commands);
        if (isEmptyArray(readRegisters)) {
          if (isDebug) {
            log("ERROR: Config doesn't have read registers");
          }
        }
  
        var ct = 1;
        readRegisters.forEach(function (readRegister) {
          if (isDebug) {
            log('Command  ' + ct + ': ' + readRegister);
          }
          setAutoPollByRegisterType(frequency, readRegister, commands[readRegister], maxReadLength, adapterName);
        });
      }
  
      /**
       * iterate through each adapter config data
       * and for each frequency execute 'processFrequency'
       */
      function getAdapterConfigCallback(err, results) {
        if (err) {
          resp.error(results);
        }
        if (!results || isEmptyArray(results)) {
          if (isDebug) {
            log('Config not found in DB');
          }
          resp.error('Config not found in DB');
        }
        results.forEach(function (result) {
          if (isEmptyString(result.adapter_settings)) {
            if (isDebug) {
              log('Missing adapter settings');
            }
            resp.error('Missing adapter settings');
          }
          var autoPoll = result.adapter_settings;
          autoPoll = JSON.parse(autoPoll);
          const adapterName = result.adapter_name;
  
          if (!adapterName || !autoPoll.hasOwnProperty('pollingIntervals') || isEmptyArray(autoPoll.pollingIntervals)) {
            if (isDebug) {
              log("ERROR: Config doesn't have frequencies");
            }
            resp.error("Config doesn't have frequencies");
          }
  
          const frequencies = autoPoll.pollingIntervals;
          const maxReadLength = autoPoll.modbusConstConfig.maxReadLength;
          if (!maxReadLength) {
            if (isDebug) {
              log('ERROR: Max read length is not defined');
            }
          }
  
          frequencies.forEach(function (frequency) {
            processFrequency(frequency, maxReadLength, adapterName);
          });
        });
      }
  
      /**
       * Start Here
       * Get all adapter config data which adapter_type set as "modbus"
       * */
      getAdapterConfig({ adapterType: adapterType.modbus }, getAdapterConfigCallback);
    }
  }
  