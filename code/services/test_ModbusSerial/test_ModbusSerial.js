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

// "35.184.34.62" is rheemdev-single-node which is currently unused except for a simple Modbus Server
// The server hosts:
// 8 Coils starting at addr. 0
// 8 Discrete Inputs starting at addr. 10000
// 8 Input Registers starting at addr. 30000
// 8 Holding Registers starting at addr. 40000

function test_ModbusSerial(req,resp){
    // These are parameters passed into the code service
    var params = req.params;
    //  { "ipAddress": "54.67.57.187", "modBus_device_id": 1, "port": "2502" }
    var mbServerIp = "54.67.57.187";
    var mbServerPort = 2502
    var client = new ModbusRTU();
    client.connectTCP(mbServerIp, { port: mbServerPort }, run);
    function run() {
        client.setID(1);
        //client.writeRegister(40000, 12).then(function() {
            readHR(40000, 8).then(function(data) { 
                log("response " + data)
                resp.success(data)
            }).catch(function(err) {resp.error(err)});
        //})
    }

    function readHR(addr, num_reg) {
        return new Promise(function(res, rej) {
            client.readHoldingRegisters(addr, num_reg, function(err, data) {
                if (err) {
                    rej(err);
                } else {
                    res(data.data);
                }
            })
        })
    }

    function readIR(addr, num_reg) {
        return new Promise(function(res, rej) {
            client.readInputRegisters(addr, num_reg, function(err, data) {
                if (err) {
                    rej(err);
                } else {
                    res(data.data);
                }
            })
        })
    }

    function readDI(addr, num_reg) {
        return new Promise(function(res, rej) {
            client.readDiscreteInputs(addr, num_reg, function(err, data) {
                if (err) {
                    rej(err);
                } else {
                    res(data.data);
                }
            })
        })
    }

    function readCO(addr, num_reg) {
        return new Promise(function(res, rej) {
            client.readCoils(addr, num_reg, function(err, data) {
                if (err) {
                    rej(err);
                } else {
                    res(data.data);
                }
            })
        })
    }
}
