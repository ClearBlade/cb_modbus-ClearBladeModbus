/**
 * Type: Library
 * Description: A library that contains a function which, when called, returns an object with a public API.
 */
const isDebug = DEBUG_LOG.SS_PERFORM_ACTION;

function checkPreConditions(modbusConfig, preConditionConfig) {
    return new Promise(function (fulfill, rej) {
        if (!preConditionConfig.start || !preConditionConfig.length
            || !preConditionConfig.registerType || !preConditionConfig.condition
            || !preConditionConfig.dataType || !preConditionConfig.value) {
            if (isDebug) {
                log("Pre-condition Rejected")
            }
            fulfill(PRECONDITION_REJECTED);
            return;
        }

        performReadRegisterAction(modbusConfig, preConditionConfig.registerType,
            preConditionConfig.start, preConditionConfig.length, {}).then(function (result) {
                const result = result.result;
                const value = convertToDataType[preConditionConfig.dataType](result, preConditionConfig);
                const isCondApprove = checkCondition(value, preConditionConfig.value, preConditionConfig.condition);
                if (isDebug) {
                    log("condition result: " + isCondApprove)
                }
                const promiseResult = isCondApprove ? PRECONDITION_APPROVE : PRECONDITION_REJECTED
                fulfill(promiseResult)
            }).catch(function (err) {
                if (isDebug) {
                    log("Error while reading data from modbus" + JSON.stringify(err))
                }
                fulfill(PRECONDITION_REJECTED);
            });
    });
}


const EDGE_ASSETS_MAPPING_COLLECTION = null;

function getEdgeAssetsMapping(params, callback) {
    if (EDGE_ASSETS_MAPPING_COLLECTION == null)
        EDGE_ASSETS_MAPPING_COLLECTION = ClearBlade.Collection({
            "collectionName": DB.edgeAssetMappings
        });

    var query = ClearBlade.Query();

    if (params.hasOwnProperty("assetId")) query.equalTo('asset_id', params.assetId);
    EDGE_ASSETS_MAPPING_COLLECTION.fetch(query, function (err, data) {
        if (err) {
            callback(err, responseMessage.ERR_GET_AUTOPOLL_CONFIG);
        } else {
            callback(err, data.DATA);
        }
    });
}


function getBulkReadRegMsgPayload(regConfig, adapterName) {
    const payload = {}
    payload.readRegister = regConfig.readType;
    payload.startingAddress = regConfig.modBUSAdd;
    payload.length = regConfig.length;
    payload.objectsForBulkRead = {};
    payload.objectsForBulkRead[regConfig.modBUSAdd] = regConfig;
    payload.adaptorName = adapterName;
    return payload;
}

