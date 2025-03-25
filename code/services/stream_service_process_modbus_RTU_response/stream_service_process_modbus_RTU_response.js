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

function stream_service_process_modbus_RTU_response(req, resp) {
  const isDebug = DEBUG_LOG.SS_MODUBS_RTU_RESPONSE;
  ClearBlade.init({ request: req });

  var messaging = new MQTT.Client();
  messaging.subscribe(topics.MODBUS_RTU_RESPONSE, onMessage).catch(function (reason) {
    if (isDebug) {
      log('received ERROR on topic ' + topic + ': ' + reason);
    }
  });
  function onMessage(topic, message) {
    if (isDebug) {
      log('received message on topic ' + topic + ': ' + message.payload);
    }
    processMessage(message.payload, topic);
  }

  // {
  //   "AddressCount": 1,
  //   "Data": [
  //     12384
  //   ],
  //   "FunctionCode": 3,
  //   "ModbusHost": "this can be any string",
  //   "StartAddress": 2054,
  //   "success": true,
  //   "timestamp": "2022-12-22T13:41:59.170Z"
  // }

  // "{\"AddressCount\":1,\"Data\":[0],\"FunctionCode\":4,\"ModbusHost\":\"this can be any string\",\"StartAddress\":103,\"success\":true,\"timestamp\":\"2022-12-20T03:39:01.306Z\"}"
  function processMessage(msg, topic) {
    msg = JSON.parse(msg);
    const data = msg.Data;
    const length = msg.AddressCount;
    const startAdd = msg.StartAddress;
    const registerTypeCode = msg.FunctionCode;

    if (isEmptyArray(msg.Data) || length <= 0 || startAdd < 0 || !registerTypeCode) {
      if (isDebug) {
        log('Missing required parameter in message payload');
      }
      resp.error('Missing required parameter in message payload');
      return;
    }
    function getValueByKeyForCacheCB(err, cData) {
      if (isDebug) {
        log('---------');
        log(err);
        log(cData);
        log('---------');
      }
      if (err) {
        if (isDebug) {
          log('Error while getting data from ' + CACHE.MODBUS_RTU_READ_STATE);
        }
        return;
      } else {
        if (!cData || isEmptyObject(cData) || isEmptyObject(cData.objects) || isEmptyObject(cData.asset)) {
          if (isDebug) {
            log('No state data found in cache for params ' + JSON.stringify(cacheParams));
          }
        } else {
          const resultPayload = {};
          resultPayload.result = msg.Data;
          resultPayload.objects = cData.objects;
          resultPayload.asset = cData.asset;
          messaging.publish(topics.requestNormalizer, JSON.stringify([resultPayload]));
          if (isDebug) {
            log('Publish Data on topic: ' + topics.requestNormalizer);
            log(resultPayload);
          }
        }
      }
    }

    const cacheParams = {
      cache_name: CACHE.MODBUS_RTU_READ_STATE,
      key: registerTypeCode + '' + startAdd + '' + length
    };
    getValueByKeyForCache(cacheParams, getValueByKeyForCacheCB);
  }
}
