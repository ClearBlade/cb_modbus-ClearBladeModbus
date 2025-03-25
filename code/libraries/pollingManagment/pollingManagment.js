const isDebug = DEBUG_LOG.SS_PROCESS_MODBUS_CONFIG;
const AUTOPOLL_COLLECTION = null;

function getAdapterConfig(params, callback) {
  if (AUTOPOLL_COLLECTION == null)
    AUTOPOLL_COLLECTION = ClearBlade.Collection({
      collectionName: DB.adapterConfig
    });

  var query = ClearBlade.Query();

  if (params.hasOwnProperty('adapterType')) query.equalTo('adapter_type', params.adapterType);
  if (params.hasOwnProperty('adapterName')) query.equalTo('adapter_name', params.adapterName);
  if (params.hasOwnProperty('edgeName')) query.equalTo('edge_name', params.edgeName);
  AUTOPOLL_COLLECTION.fetch(query, function (err, data) {
    if (err) {
      callback(err, responseMessage.ERR_GET_AUTOPOLL_CONFIG);
    } else {
      callback(err, data.DATA);
    }
  });
}

function getAdapterConfigCache(asset, byPassCache, callback) {
  const key = asset.type;
  const cacheParams = {
    cache_name: CACHE.ADAPTER_CONFIG,
    key
  };

  function updateCacheData(adaperConfig) {
    cacheParams.data = adaperConfig;
    if (isDebug) {
      log('Updated catch with Data');
      log(cacheParams);
    }
    setValueForCache(cacheParams, function (err, data) {
      if (isDebug) {
        log('Ading value in cache for params : ' + JSON.stringify(cacheParams));
      }
    });
  }

  function getAdapterConfigCallback(err, data) {
    if (err) {
      callback(true, 'Error while fetching adapter Config');
    } else {
      if (!byPassCache) updateCacheData(data);
      if (isDebug) {
        log('DB Data');
      }
      log(data);
      callback(false, data);
    }
  }
  function getValueByKeyForCacheCB(err, cData) {
    if (isDebug) {
      log('---------');
      log(err);
      log(cData);
      log('---------');
    }
    if (err) {
      getAdapterConfig({ adapterName: asset.type }, callback);
    } else {
      if (!cData || isEmptyArray(cData) || isEmptyObject(cData[0])) {
        getAdapterConfig({ adapterName: asset.type }, getAdapterConfigCallback);
      } else {
        if (isDebug) {
          log('Got data from cache');
        }
        callback(false, cData);
      }
    }
  }
  if (byPassCache) {
    if (isDebug) {
      log('BY pass chache');
    }
    getAdapterConfig({ adapterName: asset.type }, getAdapterConfigCallback);
  } else {
    getValueByKeyForCache(cacheParams, getValueByKeyForCacheCB);
  }
}

function getRegisterConfig(adapterConfig, registerType, regAdd) {
  const pollingIntervals = adapterConfig.pollingIntervals;
  var result;
  pollingIntervals.forEach(function (pollingIntervalConfig) {
    const commands = pollingIntervalConfig.commands;
    if (commands.hasOwnProperty(registerType) && commands[registerType].hasOwnProperty(regAdd)) {
      result = commands[registerType][regAdd];
    }
  });
  return result;
}
