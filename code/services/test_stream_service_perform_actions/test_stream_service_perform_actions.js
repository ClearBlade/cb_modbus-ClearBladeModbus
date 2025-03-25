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

function test_stream_service_perform_actions(req, resp) {
    // These are parameters passed into the code service
    var params = req.params
    ClearBlade.init({ request: req });
    const messaging = ClearBlade.Messaging();
    // msg = JSON.parse(msg);

    const modbusConfig = { "ipAddress": "54.67.57.187", "modBus_device_id": 1, "port": "2502" }
    const msg = { control: { id: "idle" }, asset: { id: "", "type": "" } };
    var updateMsg = {
        last_updated: new Date().toISOString(),
        id: msg.asset.id,
        "type": msg.asset.type,
        custom_data: {}
    }
    const controlKey = msg.control.id;
    log(controlKey);

    function sendUpdateMessage(msg, updateMsg) {
        updateMsg.custom_data["Feedback"] = "COMMAND SUCCESSFUL"
        // updateMsg.custom_data["Executed By"] = msg.user.email
        updateMsg.custom_data["Command Executed"] = new Date().toISOString()
        messaging.publish("_monitor/asset/default/data/_platform", JSON.stringify(updateMsg))
    }

    function sendErrorMessage(err, updateMsg) {
        updateMsg.custom_data["Feedback"] = JSON.stringify(err)
        messaging.publish("_monitor/asset/default/data/_platform", JSON.stringify(updateMsg))
        resp.error(err)
    }
    function preConditionResult(preConditionRes, controlCommandInfo) {
        if (preConditionRes == PRECONDITION_REJECTED) {
            updateMsg.custom_data["Feedback"] = "HAND MODE - COMMAND NOT ALLOWED"
            cbClient.publish("_monitor/asset/default/data/_platform", JSON.stringify(updateMsg))
        } else {
            const registerType = controlCommandInfo.registerType;
            const writes = controlCommandInfo.writes;

            const writesPromises = writes.map(function (writeParams) {
                return performWriteRegisterAction(modbusConfig, registerType,
                    writeParams.address, writeParams.value, {});
            })

            Promise.all(writesPromises).then(function (result) {
                sendUpdateMessage(result, updateMsg)
            }).catch(function (err) {
                sendErrorMessage(err, updateMsg)
            });

            // performWriteRegisterAction(modbusConfig, registerType, startAdd, value, {})
            //     .then(function (result) {
            //         sendUpdateMessage(result, updateMsg)
            //     }).catch(function (err) {
            //         sendErrorMessage(err, updateMsg)
            //     });
        }
    }
    function getAdapterConfigCallback(err, result) {
        if (err) {
            log("Error while fetching config from DB");
            sendErrorMessage("Error while fetching config from DB", updateMsg)
            resp.error(result);
        }
        if (!result || isEmptyArray(result) || isEmptyString(result[0].adapter_settings)) {
            log("Config not found in DB");
            sendErrorMessage("Config not found in DB", updateMsg)
            resp.error("Config not found in DB");
        }
        var configJson = result[0].adapter_settings;
        configJson = JSON.parse(configJson);
        assetType = result[0].adapter_name;

        if (!configJson.hasOwnProperty("actions") || isEmptyObject(configJson.actions)
            || !configJson.actions.hasOwnProperty("commands") || isEmptyObject(configJson.actions.commands)
            || isEmptyObject(configJson.actions.commands[controlKey])) {
            log("ERROR: Invalid Config, Doen't have action or commands");
            sendErrorMessage("ERROR: Invalid Config, Doen't have action or commands", updateMsg)
            resp.error("Invalid Config, Doen't have action or commands");
        }

        const commands = configJson.actions.commands;
        const controlCommandInfo = commands[controlKey];
        log(controlCommandInfo);
        if (!controlCommandInfo.registerType || isEmptyArray(controlCommandInfo.writes)) {
            log("ERROR: Invalid Config, Doen't have enough info in config");
            sendErrorMessage("ERROR: Invalid Config, Doen't have enough info in config", updateMsg)
            resp.error("Invalid Config, Doen't have action or commands");
        }

        const actionPreConditions = controlCommandInfo.preConditions;
        if (!actionPreConditions && isEmptyArray(actionPreConditions)) {
            preConditionResult(PRECONDITION_APPROVE, controlCommandInfo)
        } else {
            const preConditionsConfig = configJson.actions.preConditions || {};
            const preCondConfigKeys = Object.keys(preConditionsConfig);
            if (isEmptyArray(preCondConfigKeys)) {
                log("ERROR: Invalid Config, Doen't have preconditions");
                sendErrorMessage("Invalid Config, Doen't have preconditions", updateMsg);
                resp.error("Invalid Config, Doen't have preconditions");
            }
            const supportedPreConds = actionPreConditions.filter(function (actionPreCondition) {
                return preCondConfigKeys.indexOf(actionPreCondition) >= 0;
            });

            if (isEmptyArray(supportedPreConds)) {
                log("ERROR: Action's precondition/s are not supported");
                sendErrorMessage("Action's precondition/s are not supported", updateMsg);
                resp.error("Action's precondition/s are not supported");
            }

            const preCondsPromises = supportedPreConds.map(function (supportedPreCond) {
                return checkPreConditions(modbusConfig, preConditionsConfig[supportedPreCond]);
            })

            Promise.all(preCondsPromises).then(function (result) {
                log("Read Final result");
                log(result);
                const preCondResult = result.length > 0 && result.indexOf(PRECONDITION_REJECTED) >= 0
                    ? PRECONDITION_REJECTED : PRECONDITION_APPROVE;
                preConditionResult(preCondResult, controlCommandInfo)
            }).catch(function (err) {
                preConditionResult(PRECONDITION_REJECTED, controlCommandInfo)
            });
        }
        resp.success("Success");
    }

    getAdapterConfig({ adapterType: 'modbus' }, getAdapterConfigCallback)
}
