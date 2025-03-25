var ASSETS_COLLECTION = null;

function getAssets(params, callback) {
    if (ASSETS_COLLECTION == null)
        ASSETS_COLLECTION = ClearBlade.Collection({
            "collectionName": DB.assets
        });

    var query = ClearBlade.Query();
    //logStdErr("params " + JSON.stringify(params))
    if (params.hasOwnProperty("adapterName")) query.equalTo('type', params.adapterName);
    //if (params.hasOwnProperty("id")) query.equalTo('id', params.id);   
    ASSETS_COLLECTION.fetch(query, function (err, data) {
        if (err) {
            callback(err, responseMessage.ERR_GET_ASSETS);
        } else {
            callback(err, data.DATA);
        }
    });
}

function getAssetsCache(params, callback) {
    log("inn   getAssetsCache");
    log(params);
    const adapterName = params.adapterName;
    const updateCache = params.updateCache;
    const byPassCache = params.byPassCache;
    const cacheParams = {
        cache_name: CACHE.ASSETS,
        key: adapterName
    }

    function updateCacheData(assets) {
        cacheParams.data = assets;
        log("Updated catch with Data");
        log(cacheParams);
        setValueForCache(cacheParams, function (err, data) {
            log("Ading value in cache for params : " + JSON.stringify(cacheParams));
        })
    }

    function getAssetsCallback(err, data) {
        if (err) {
            callback(true, "Error while fetching adapter Config");
        } else {
            updateCacheData(data);
            log("DB Data", data);
            callback(false, data);
        }

    }

    function getValueByKeyForCacheCB(err, cData) {
        log("---------");
        log(err);
        log(cData);
        log("---------");
        if (err) {
            getAssets({ adapterName }, callback);
        } else {
            if (!cData || isEmptyArray(cData) || isEmptyObject(cData[0])) {
                getAssets({ adapterName }, getAssetsCallback);
            } else {
                log("Got data from cache : ", cData);
                callback(false, cData);
            }
        }
    }

    if (byPassCache) {
        log("byPassCache")
        getAssets({ adapterName }, callback);
    } else if(updateCache) {
        log("updateCache")
        getAssets({ adapterName }, getAssetsCallback);
    } else {
        getValueByKeyForCache(cacheParams, getValueByKeyForCacheCB)
    }

}