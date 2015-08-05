module.exports = function(RED) {
    var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();
    function WriteBTSerial(config) {
        RED.nodes.createNode(this, config);
        this.btaddress = config.btaddress;
        this.btname = config.btname;
        var node = this;

        this.on('input', function(msg) {
            if (msg.topic === "address") {
                var address = msg.payload;
                console.log("connecting to: " + address);
                msg.payload = "connecting to: " + address;
                node.send(msg);
                btSerial.findSerialPortChannel(address, function(channel) {
                    btSerial.connect(address, channel, function() {
                        console.log('connected to: ' + address);
                        msg.payload = "Success! Connected to: " + address;
                        var bufferhack = "";
                        btSerial.on('data', function(buffer) {
                            console.log(buffer);
                            for (var i=0; i<buffer.length; i++) {
                                if (buffer[i] != 10) {
                                    var buf = new Buffer(1);
                                    buf[0] = buffer[i];
                                    bufferhack += buf.toString('ascii');
                                } else {
                                    msg.payload = bufferhack;
                                    node.send(msg);
                                    console.log(bufferhack);
                                    bufferhack = "";
                                    break;
                                }
                            }
                        }); 
                    });
                });
            } else {
                var buffer = new Buffer(msg.payload);
                msg.payload = buffer.toString('ascii');
                node.send(msg);
                btSerial.write(buffer, function(error, bytes) {
                    if (error) {
                        console.log("Bluetooth serial write error: " + error);
                    } else {
                        console.log("Wrote " + bytes + " bytes to Bluetooth serial");
                    }
                });
            }
        });

        this.on('close', function() {
        });
    }
    RED.nodes.registerType("bluetooth", WriteBTSerial);
}
