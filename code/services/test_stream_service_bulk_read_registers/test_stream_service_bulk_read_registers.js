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

function test_stream_service_bulk_read_registers(req, resp) {
    // These are parameters passed into the code service
    // msg = JSON.parse(msg);
    // // const msg = { "readRegister": "readHoldingReg", "startingAddress": "0076", "length": 189, "objectsForBulkRead": { "0076": { "type": "32Float", "deltaL": ".554", "length": 2, "attribute_name": "flowSCFM", "processDeltaOnly": true }, "0096": { "length": 2, "attribute_name": "minPressure", "type": "32Float" }, "0098": { "type": "32Float", "length": 2, "attribute_name": "maxPressure", "processDeltaOnly": false }, "009C": { "attribute_name": "pressure", "type": "32Float", "length": 2 }, "0130": { "type": "32Integer", "length": 2, "attribute_name": "alarmCounter" }, "0132": { "type": "boolean", "length": 1, "attribute_name": "alarmStatus" } } };                   
    const msg = {
        "readRegister": "coilRegister",
        "startingAddress": "0",
        "length": 3,
        "objectsForBulkRead": {
            "0": {
                "rate": "30",
                "length": "1",
                "attribute_name": "Restart Coil",
                "modBUSAdd": "0",
                "readType": "coilRegister",
                "dataType": "boolean",
                "processDeltaOnly": 0
            },
            "1": {
                "rate": "30",
                "length": "1",
                "attribute_name": "Start Coil",
                "modBUSAdd": "1",
                "readType": "coilRegister",
                "dataType": "boolean",
                "processDeltaOnly": 0
            },
            "2": {
                "rate": "30",
                "length": "1",
                "attribute_name": "Stop Coil",
                "readType": "coilRegister",
                "modBUSAdd": "2",
                "dataType": "boolean",
                "processDeltaOnly": 0
            }
        },
        "adaptorName": "Pump"
    };
    const readRegister = msg["readRegister"];
    const startingAddress = msg["startingAddress"];
    const length = msg["length"];
    const objectsForBulkRead = msg["objectsForBulkRead"];

    log("msg recieved", msg);
    logStdErr("msg recieved", JSON.stringify(msg));

    //todo:  change variable name to adapterName. 
    const assetType = msg["assetType"]; //assetType is not in message
    const adaptorName = msg["adaptorName"];

    log('&&&&&&&&&&&&&&&&&&&. ASSET TYPE:  ' + adaptorName + '  Processing:  ' + readRegister + ':  Starting Adderss; ' + startingAddress + ',  Length:  ' + length);
    logStdErr('&&&&&&&&&&&&&&&&&&&. ASSET TYPE:  ' + adaptorName + '  Processing:  ' + readRegister + ':  Starting Adderss; ' + startingAddress + ',  Length:  ' + length);
    if (!readRegister || !startingAddress || length <= 0 || isEmptyObject(objectsForBulkRead)) {
        log('Missing parameters');
        logStdErr('Missing parameters');
        resp.error('Missing parameters');
    }

    function getAssetsCallback(err, assets) {
        if (err) {
            log('Missing parameters');
            logStdErr('Missing parameters');
            resp.error("Error while getting asserts");
        }

        if (isEmptyArray(assets)) {
            log('No assets found');
            logStdErr('No assets found');
            //resp.error("No assets found");
        }
        const state = {};
        state['objects'] = objectsForBulkRead;

        log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%.  assets:  " + JSON.stringify(assets));

        const actions = assets.filter(function (asset) {
            log("in FILTER - asset:  " + JSON.stringify(asset));

            // if (isEmptyString(asset.custom_data)) {
            //     log("in FILTER - asset.custom_data is empty returning false:  " + JSON.stringify(asset.custom_data));

            //     return false;
            // }
            const customData = JSON.parse(asset.custom_data);
            log("in FILTER - customeData:  ", customData);

            return true;
            //log("condition equals:  " + (!isEmptyString(customData.ipAddress) && customData.port && customData.modBus_device_id));
            //return !isEmptyString(customData.ipAddress) && customData.port && customData.modBus_device_id;
        }).map(function (asset) {
            state['asset'] = asset;
            log("in MAP - asset:  " + JSON.stringify(asset));

            return performReadRegisterAction(JSON.parse(asset.custom_data), readRegister, startingAddress, length, state);
        });
        log('Actions:  ', actions);

        if (isEmptyArray(actions)) {
            log('No assets found with required config');
            return;
            // resp.error("No assets found with required config");
        }

        Promise.all(actions).then(function (result) {
            log("-->>Final Modbus Read Results<<--");
            logStdErr("-->>Final Modbus Read Results<<--");


            log(JSON.stringify(result));
            logStdErr(JSON.stringify(result));
            const isModbusRTURead = result.some(function (readRes) {
                return readRes == MODBUS_RTU_READ_WRITE_INITIATED
            });
            if (!isModbusRTURead) {
                log("Publishing on TOPIC:  " + topics.requestNormalizer);
                log('----------------------------------', result);
                logStdErr("Publishing on TOPIC:  " + topics.requestNormalizer);
                logStdErr('----------------------------------', result);
                messaging.publish(topics.requestNormalizer, JSON.stringify(result));
            } else {
                log("Modbus RTU read initiated");
            }

            // resp.success("Success");
        }).catch(function (err) {
            log("Error while getting Modbus data")
            log("error:  ", err);
            // resp.error("Exception");
        });
    };
    getAssets({ adaptorName }, getAssetsCallback);
}


