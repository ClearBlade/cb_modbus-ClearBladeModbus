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


//FRENIC ONLY
function test_ModbusSerial_2(req, resp) {
    // These are parameters passed into the code service
    var params = req.params;
    //var mbServerIp = "35.184.34.62";
    var mbServerIp = "192.168.50.12";
    var mbServerPort = 502
    var client = new ModbusRTU();
    client.connectTCP(mbServerIp, { port: mbServerPort }, run);
    function run() {
        log("ab to write  Hz")
        client.setID(2); //CHANGED ADDRESS TO 2
        //client.writeRegister(3590, 1).then(function() { //y06 write a 1 for even parity
        //client.writeRegister(1054, 0).then(function() {resp.success("CHANGE H30")}).catch(function(err) {resp.error(err)}); //H30 write a 0 for keypad control
        //client.writeRegister(1054, 8).then(function() {resp.success("CHANGE H30")}).catch(function(err) {resp.error(err)}); //H30 write a 8 for automation control
        //client.writeRegister(1798, 13).then(function() {resp.success("WROTE TO X3")}).catch(function(err) {resp.error(err)});  //CHANGES FROM STOP TO RUN!!!
        client.writeRegister(1798, 8193).then(function() {resp.success("WROTE TO FWD")}).catch(function(err) {resp.error(err)});  //write fwd

        //client.writeRegister(1801, 500).then(function() {resp.success("WROTE TO X3")}).catch(function(err) {resp.error(err)});  //Write decelation 30
    
        //client.writeRegister(259, 24).then(function() {resp.success("CHANGE H30")}).catch(function(err) {resp.error(err)}); //E03 is 24 - switch RS485 got an error 7
        //client.writeRegister(8, 500).then(function() {resp.success("CHANGE H30")}).catch(function(err) {resp.error(err)}); //E03 is 24 - switch RS485 got an error 7

        //1. change H30
        //2. Set X3
        //3. Set Speed
        //4. Set FWD
        // //5. Change Speed
        // client.writeRegister(1793, 0).then(function(data) { //5000 = 15Hz
        //      log("wrote Hz " + JSON.stringify(data))
        //     resp.success()
        // }).catch(function(err) {resp.error(err)});

        // readHR(1798, 1).then(function(data) {  //2054 read Hz
        //     log("response " + data)
        //     resp.success(data)
        // }).catch(function(err) {resp.error(err)});


        // readHR(1798, 1).then(function(data) {  //M16 latest alarm contents
        //     log("response " + data)
        //     resp.success(data)
        // }).catch(function(err) {resp.error(err)});



        // readHR(1054, 1).then(function(data) {  //h30
        //     log("response " + data)
        //     resp.success(data)
        // }).catch(function(err) {resp.error(err)});
        
        

        // READ REGISTER S06 to find out hand or auto mode - a response of 8192 means FWD bit is set, but nothing else is (this is expected if hand mode)
        // bit 4 = X3 
        // bit 13 = FWD (forward)

        // readHR(1800, 2).then(function (data) { 
        //     log("response " + data)
        //     resp.success(data)
        // }).catch(function (err) { resp.error(err) });

        // readHR(7, 2).then(function (data) { 
        //     log("response " + data)
        //     resp.success(data)
        // }).catch(function (err) { resp.error(err) });

        // //2054 = speed, 2055 = "Torque real value" torque current based on the rated torque current of the motor (100%) -327.68 to 327.67  = .01 %
        // readHR(2054, 2).then(function (data) { 
        //     log("response " + data)
        //     resp.success(data)
        // }).catch(function (err) { resp.error(err) });


        // READ Knob - 0 equals
        // AUTO = 22
        // OFF = 22
        // HAND = 0
        // M49
        //11837 = 35.5
        //5978  = ?
        //4957 = 15
        // readHR(2097, 1).then(function (data) { 
        //     log("response " + data)
        //     resp.success(data)
        // }).catch(function (err) { resp.error(err) });


        //READ S01
        //read 1798 = 8192 = fwd
        //M12 = 2061 = 8193 in hand mode running = 0 in off mode = 16 in Auto mode ONLY WHEN H30 is 0
        // //M14 = 2062 = 33 in hand mode running = 40 in off mode = 40 in Auto mode ONLY WHEN H30 is 0
        // readHR(2061, 2).then(function (data) {
        //     log("response " + data)
        //     resp.success(data)
        // }).catch(function (err) { resp.error(err) });
        // // //8193 HAND
        //4136
    //8209, 4129 in AUTO NOW THAT WE CHANGED E03


//0,40 in off
//8193,40 in hand




        // READ Acceleration/Decelleration
        // S08	1800
        // readHR(1800, 2).then(function (data) { 
        //     log("response " + data)
        //     resp.success(data)
        // }).catch(function (err) { resp.error(err) });

        //READ E03 - controls X3 input
        //11
        // readHR(259, 1).then(function (data) { 
        //     log("response " + data)
        //     resp.success(data)
        // }).catch(function (err) { resp.error(err) });

        // // READ C30 - HZ2 
        // //F01 = HZ1 command = 1 [enable voltage input to terminal [12]
        // //C30 = HZ2 = command 2 (potentiometer on [C1])
        // readHR(257, 5).then(function (data) { 
        //     log("response " + data)
        //     resp.success(data)
        // }).catch(function (err) { resp.error(err) });

        // readHR(1054, 1).then(function (data) { 
        //     log("response " + data)
        //     resp.success(data)
        // }).catch(function (err) { resp.error(err) });
    }

    function readHR(addr, num_reg) {
        return new Promise(function (res, rej) {
            client.readHoldingRegisters(addr, num_reg, function (err, data) {
                if (err) {
                    rej(err);
                } else {
                    res(data.data);
                }
            })
        })
    }

    function readIR(addr, num_reg) {
        return new Promise(function (res, rej) {
            client.readInputRegisters(addr, num_reg, function (err, data) {
                if (err) {
                    rej(err);
                } else {
                    res(data.data);
                }
            })
        })
    }

    function readDI(addr, num_reg) {
        return new Promise(function (res, rej) {
            client.readDiscreteInputs(addr, num_reg, function (err, data) {
                if (err) {
                    rej(err);
                } else {
                    res(data.data);
                }
            })
        })
    }

    function readCO(addr, num_reg) {
        return new Promise(function (res, rej) {
            client.readCoils(addr, num_reg, function (err, data) {
                if (err) {
                    rej(err);
                } else {
                    res(data.data);
                }
            })
        })
    }
}
