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

function trigger_adapter_config_table(req, resp) {
    // These are parameters passed into the code service
    var params = req.params;
    log('params ' + params);
  
    var cbClient;
    try {
      cbClient = new MQTT.Client();
    } catch (e) {
      resp.error('failed to init cb client: ' + e);
    }
    cbClient.publish(topics.TRIGGER_ADAPTER_CONFIG, JSON.stringify(req.params));
    resp.success('Success');
  }
  