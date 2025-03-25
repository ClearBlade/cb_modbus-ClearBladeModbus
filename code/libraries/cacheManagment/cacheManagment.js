function setValueForCache(params, callback) {
    if (isEmptyString(params.cache_name) || !params.hasOwnProperty("key")
        || !params.hasOwnProperty("data") || params.data === undefined) {
        callback(true, "Bad Request");
    }
    var setCacheCB = function (err, data) {
        if (err) {
            //log(data)
            callback(err, "Error While seting value in cache");
        } else {
            callback(err, data);
        }
    };
    var cache = ClearBlade.Cache(params.cache_name);
    cache.set(params.key, params.data, setCacheCB);
}

function getValueByKeyForCache(params, callback) {
    if (isEmptyString(params.cache_name) || !params.hasOwnProperty("key")) {
        callback(true, "Bad Request");
    }
    var getValueCB = function (err, data) {       
        if (err) {
            callback(err, "Error While fetching value from cache");
        } else {
            callback(err, data);
        }
    };
    var cache = ClearBlade.Cache(params.cache_name);
    cache.get(params.key, getValueCB);
}

