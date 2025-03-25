/**
 * Type: Micro Service
 * Description: A short-lived service which is expected to complete within a fixed period of time.
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

function test_stream_service_process_modbus_config(req, resp) {
    ClearBlade.init({ request: req });
    var messaging = ClearBlade.Messaging();
    function processAttribute(frequency, readRegister, objectsToRead, maxReadLength, adapterName) {
        // fetch all the ASSETS from the asset collection where they type matches the DEVICE_TYPE
        const objectsStartAddresses = Object.keys(objectsToRead);
        var startingAddress = objectsStartAddresses[0];
        log("startingAddress : " + startingAddress)
        var calculatedLength = 0;
        const objectsForBulkRead = {};
        objectsStartAddresses.forEach(function (objStartAdd, index) {
            const objAttributes = objectsToRead[objStartAdd];
            calculatedLength = calculateLength(startingAddress, objStartAdd, objAttributes);
            log(startingAddress + " : " + objStartAdd);
            log("Lenght: " + calculatedLength);
            if (calculatedLength < 0) {
                log('ERROR: Object address ' + objStartAdd + 'is not in order')
                return;
            }

            objectsForBulkRead[objStartAdd] = objAttributes;
            if (calculatedLength <= maxReadLength) {
                // continue iterating till calculatedLength is less then maxReadLength
                return;
            }
            log("Exceed Lenght " + calculatedLength + " : maxReadLenght  " + maxReadLength);
            // Remove current object in bulk read as current obj exceed maxReadLenght
            const previousStartAdd = objectsStartAddresses[--index];
            log("--------------------");
            log(startingAddress + " : " + previousStartAdd);
            const length = calculateLength(startingAddress, previousStartAdd, objectsToRead[previousStartAdd]);
            log("Lenght: " + length);
            log("--------------------");
            delete objectsForBulkRead[objStartAdd];
            log("In")
            log({ readRegister, startingAddress, length, objectsForBulkRead, adaptorName: adapterName });
            messaging.publish(topics.bulkReadRegisters, JSON.stringify({ readRegister, startingAddress, length, objectsForBulkRead, adaptorName: adapterName }));
            startingAddress = objStartAdd;
            calculatedLength = objAttributes.length;
            objectsForBulkRead = {};
            objectsForBulkRead[objStartAdd] = objAttributes;
        });

        log({ readRegister, startingAddress, length: calculatedLength, objectsForBulkRead, adaptorName: adapterName });
        messaging.publish(topics.bulkReadRegisters, JSON.stringify({ readRegister, startingAddress, length: calculatedLength, objectsForBulkRead, adaptorName: adapterName }));
        if (++count == 2)
            resp.success("Success");
        // setAutoPollByRegisterType(frequency, readRegister, objectsToRead);
    }
    var count = 0
    function setAutoPollByRegisterType(frequency, readRegister, objectsToRead, maxReadLength, adapterName) {
        processAttribute(frequency * 1000, readRegister, objectsToRead, maxReadLength, adapterName);
        // setTimeout(processAttribute, frequency * 1000, frequency, readRegister, objectsToRead, maxReadLength, adapterName);
    }

    function processFrequency(frequencyData, maxReadLength, adapterName) {
        const frequency = frequencyData.frequency;
        if (!frequencyData.hasOwnProperty('commands') || isEmptyObject(frequencyData.commands)) {
            log("ERROR: Config doesn't have attributes");
        }

        const commands = frequencyData.commands;
        const readRegisters = Object.keys(commands);
        if (isEmptyArray(readRegisters)) {
            log("ERROR: Config doesn't have read registers");
        }

        var ct = 1;
        readRegisters.forEach(function (readRegister) {

            log('Command  ' + ct + ': ' + readRegister);
            setAutoPollByRegisterType(frequency, readRegister, commands[readRegister], maxReadLength, adapterName);
        });
    }

    function getAdapterConfigCallback(err, results) {
        if (err) {
            resp.error(results);
        }
        if (!results || isEmptyArray(results)) {
            log("Config not found in DB");
            resp.error("Config not found in DB");
        }
        results.forEach(function (result) {
            if (isEmptyString(result.adapter_settings)) {
                log("Mising adapter settings");
                resp.error("Mising adapter settings");
            }
            var autoPoll = result.adapter_settings;
            autoPoll = JSON.parse(autoPoll);
            const adapterName = result.adapter_name;
            //TODO remove below 2 lines just for testing purpose
            // messaging.publish("test/hello", "GEt config Data " + JSON.stringify(autoPoll));
            // const autoPoll = { "pollingIntervals": [{ "frequency": 30, "commands": { "readHoldingReg": { "0076": { "type": "32Float", "deltaL": ".554", "length": 2, "attribute_name": "flowSCFM", "processDeltaOnly": true }, "0096": { "length": 2, "attribute_name": "minPressure", "type": "32Float" }, "0098": { "type": "32Float", "length": 2, "attribute_name": "maxPressure", "processDeltaOnly": false }, "009C": { "attribute_name": "pressure", "type": "32Float", "length": 2 }, "0130": { "type": "32Integer", "length": 2, "attribute_name": "alarmCounter" }, "0001": { "type": "32Integer", "length": 2, "attribute_name": "transmitterSerialNumber" }, "0003": { "attribute_name": "transmitterFirmwareVersion", "type": "byte_stream", "length": 3 }, "0006": { "attribute_mapping": [{ "mask": "0040", "attributeName": "enabledFlag" }], "type": "flagMask", "length": 3 }, "0064": { "deltaGL": ".554", "roundTo": 3, "minUpdate": 360, "attribute_name": "minFlow", "processDeltaOnly": true, "type": "32Float", "length": 2 }, "0066": { "length": 2, "attribute_name": "maxFlow", "processDeltaOnly": true, "type": "32Float", "deltaG": ".554" }, "0132": { "type": "boolean", "length": 1, "attribute_name": "alarmStatus" } } } }], "modbusConstConfig": { "maxReadType": "bytes | regs", "maxReadLength": 255 } };

            if (!adapterName || !autoPoll.hasOwnProperty("pollingIntervals") || isEmptyArray(autoPoll.pollingIntervals)) {
                log("ERROR: Config doen't have frequencites");
                resp.error("Config doen't have frequencites");
            }

            const frequencies = autoPoll.pollingIntervals;
            const maxReadLength = autoPoll.modbusConstConfig.maxReadLength;
            if (!maxReadLength) {
                log('ERROR: Max read lenght is not defined');
            }

            frequencies.forEach(function (frequency) {
                processFrequency(frequency, maxReadLength, adapterName);
            });
        })
    }
    // const assetType = asset_type.flowController;
    // const maxReadLength = 0;
    //TODO Remove assetType
    getAdapterConfig({ adapterType: "modbus" }, getAdapterConfigCallback);
}
