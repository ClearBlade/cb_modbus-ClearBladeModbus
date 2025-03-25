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

function test_stream_service_normalizer(req, resp) {
    ClearBlade.init({ request: req });
    const messaging = ClearBlade.Messaging();
    msg = [
        {
            "result": [
                false,
                true,
                false
            ],
            "objects": {
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
            "asset": {
                "owners": "[]",
                "location_x": null,
                "item_id": "55f198c6-fd6a-4d48-9296-b45ddfbe6ab5",
                "id": "ClearBlade Lab CP750",
                "last_updated": "2023-01-09T06:47:57.643Z",
                "location_updated": null,
                "custom_data": "{\"Active Fault Count\":0,\"Set Speed\":0,\"Discharge Pressure\":1,\"State\":false,\"Feedback\":\"{}\",\"Suction Pressure\":-9,\"Battery\":15.4,\"Temperature\":\"-8.0\",\"Status\":true,\"Fuel\":102,\"Last Command\":\"Restart Panel\",\"Command Ordered\":\"2023-01-06T14:06:16.285Z\",\"Executed By\":\"rmcclure@clearblade.com\",\"Command Executed\":\"2022-08-15T17:19:22.548Z\",\"Mode\":true,\"Network Connection\":true,\"Current Speed\":\"0\",\"Oil Pressure\":\"0.0\",\"Pressure Sensor Feedback\":0,\"key\":\"value5\",\"Skid Number\":\"Skid #16\",\"parity\":\"even\",\"stopBits\":1,\"modBus_device_id\":1,\"baudRate\":19200,\"serialPort\":\"/dev/ttyM0\",\"command\":\"Start\",\"values\":[false,true],\"feedback\":\"COMMAND Failed : \\\"PRE-Condition Rejected:  COMMAND NOT ALLOWED\\\"\",\"Stop Coil\":false,\"Start Coil\":true,\"Restart Coil\":false}",
                "parent": null,
                "location_unit": null,
                "custom_id_1": null,
                "longitude": null,
                "latitude": null,
                "image": null,
                "tree_id": "53be85bc-9c97-4a54-b9dd-26da8a2d4eca",
                "group_id": "ClearBlade",
                "is_root": false,
                "label": "ClearBlade Diesel Pump",
                "description": null,
                "location_y": null,
                "location_z": null,
                "location_type": null,
                "custom_id_2": null,
                "type": "Pump",
                "last_location_updated": null,
                "attributes_last_updated": {
                    "Last Command": "2023-01-06T14:06:16.286Z",
                    "Pressure Sensor Feedback": "2022-08-12T21:20:32.623Z",
                    "Restart Coil": "2023-01-09T06:47:56.536Z",
                    "Start Coil": "2023-01-09T06:47:56.536Z",
                    "Current Speed": "2023-01-09T06:47:57.283Z",
                    "State": "2023-01-09T06:47:57.643Z",
                    "Temperature": "2023-01-09T06:47:57.283Z",
                    "values": "2023-01-08T13:00:00.890Z",
                    "Network Connection": "2022-08-19T01:14:27.676Z",
                    "Oil Pressure": "2023-01-09T06:47:57.283Z",
                    "feedback": "2022-12-29T07:54:16.377Z",
                    "key": "2022-08-12T21:20:32.623Z",
                    "Active Fault Count": "2022-08-15T15:38:44.476Z",
                    "Command Ordered": "2023-01-06T14:06:16.286Z",
                    "Fuel": "2022-08-15T15:38:44.476Z",
                    "Mode": "2023-01-09T06:47:57.643Z",
                    "Feedback": "2022-08-15T15:55:44.156Z",
                    "Set Speed": "2023-01-09T06:47:56.772Z",
                    "Stop Coil": "2023-01-09T06:47:56.536Z",
                    "command": "2023-01-08T13:00:00.890Z",
                    "Battery": "2022-08-15T15:38:44.476Z",
                    "Command Executed": "2022-08-15T15:18:37.092Z",
                    "Discharge Pressure": "2022-07-28T20:39:03.139Z",
                    "Executed By": "2022-08-15T15:18:37.092Z"
                }
            }
        }
    ];
    const assetsResults = msg;
    // const assetsResults = JSON.parse(msg);
    if (!assetsResults || isEmptyArray(assetsResults)) {
        log("No data to parse in message:  " + JSON.stringify(assetsResults));
        logStdErr("No data to parse in message:  " + JSON.stringify(assetsResults));
        resp.error("No data to parse in message:  " + JSON.stringify(assetsResults));
    }

    assetsResults.forEach(function (assetResult) {
        log("Asset result", assetResult);
        logStdErr("Asset result", assetResult);
        const downStreamRegisters = [];
        const filterRegisters = [];
        const results = assetResult["result"];
        const objects = assetResult["objects"];
        const asset = assetResult["asset"];
        if (isEmptyArray(results) || isEmptyObject(objects), isEmptyObject(asset)) {
            log("ERROR: Missing required information(result, objects, asset) in message to process");
            logStdErr("ERROR: Missing required information(result, objects, asset) in message to process");
            resp.error("ERROR: Missing required information(result, objects, asset) in message to process");
        }
        const objectsAddresses = Object.keys(objects);
        const startAdd = objectsAddresses[0];
        log("------>  PROCESSING ADDRESSES:  ", objectsAddresses);

        objectsAddresses.forEach(function (address) {
            log("----------" + address + "-------");

            var start = calculateDiff(Number(address), Number(startAdd));
            log("------>  start:  ", start);

            if (start < 0) {
                log("------>  ", address, " - value offset found at index:  ", start, " startingAddress:  ", startAdd);
                return;
            }

            var objectInfo = objects[address];
            objectInfo.length = Number(objectInfo.length);
            var end = start + objectInfo.length;
            if (end > results.length) {
                log("------>  objectInfo.length:  ", objectInfo.length);
                log("------>  ", address, " - ending address:  ", end, " > ", results.length);
                log("------>  ", "results:  ", results);

                return;
            }

            var objModbusValue = results.slice(start, end);

            log(start + " : " + end)
            log(objModbusValue);
            log("----------");

            var objInfoWithAdd = Object.assign(objectInfo, { address });

            log('processMessage.objectInfoWithAdd:  ', objInfoWithAdd);
            logStdErr('processMessage.objectInfoWithAdd:  ', objInfoWithAdd);

            var value = getNormalizedValue(objModbusValue, objInfoWithAdd);
            log("NORMALIZED VALUE:  ==================================.   ", address, ":", value)
            // if (value < 0) {
            //     log("Error while reading value " + value + " of register " + address + " for asset ID " + asset["id"]);
            //     return;
            // }

            objInfoWithAdd.value = value;
            if (objInfoWithAdd.hasOwnProperty(filter.processDeltaOnly)
                || objInfoWithAdd.hasOwnProperty(filter.minUpdate)) {
                filterRegisters.push(objInfoWithAdd);
                return;
            }

            downStreamRegisters.push(objInfoWithAdd);
        });
        if (downStreamRegisters.length > 0) {
            sendResultDataDownStream(downStreamRegisters, asset.id, asset.type);
        }
        if (filterRegisters.length > 0) {
            const filterResults = filterRegisters.map(function (objectInfo) {
                return applyFilter({ objectInfo, asset })
            });
            Promise.all(filterResults).then(function (result) {
                log(result);
                sendResultDataDownStream(result, result[0].assetId, result[0].assetType);
                // resp.success("Success");
            }).catch(function (err) {
                log(err);
                resp.error("Exception");
            });
        }
    });

    function sendResultDataDownStream(registersData, assetId, assettype) {
        const downStreamRegistersFiltered = registersData.filter(function (register) {
            return register.hasOwnProperty('value') && register.value != ELIMINATE_REGISTER
        });

        if (isEmptyArray(downStreamRegistersFiltered)) {
            return;
        }
        /**
         * 
         var updateMsg = {
             id: {ID}, //Corresponds to the Asset ID in IA
            type: {Type}, //Corresponds to the Asset Type in IA
            custom_data: {}
            }
        
        */

        // registersData.forEach( );
        var updateMessage = {};
        updateMessage.id = assetId;
        updateMessage.type = assettype;

        var custom_data = {}
        downStreamRegistersFiltered.forEach(function (assetRecord) {
            log(assetRecord);
            custom_data[assetRecord.attribute_name] = assetRecord.value;
        });

        updateMessage.custom_data = custom_data;
        updateMessage.last_updated = new Date().toISOString();

        log('-------------Message Publish-----------')
        log('Topics:')
        var topic = util.format(topics.EDGE_TO_ASSET, assetId);
        log(topic);
        messaging.publish(topic, JSON.stringify(updateMessage));

        topic = util.format(topics.EDGE_TO_HISTORY, assetId);
        log(topic);
        messaging.publish(topic, JSON.stringify(updateMessage));

        topic = util.format(topics.EDGE_TO_LIVE, assetId);
        log(topic);
        messaging.publish(topic, JSON.stringify(updateMessage));
        log(updateMessage);

        resp.success("Success");

        // topic = util.format(topics.EDGE_TO_ASSET, assetId);
        // log(topic);
        // log('Message : \n' + JSON.stringify(downStreamRegistersFiltered));
        // messaging.publish(topic, JSON.stringify(downStreamRegistersFiltered));
    }


}
