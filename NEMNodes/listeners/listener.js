/*
 * Copyright 2018 NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = function (RED) {
    const { Listener, Address } = require('nem2-sdk');
    function listener(config) {
        RED.nodes.createNode(this, config);
        this.host = RED.nodes.getNode(config.server).host;
        this.address = config.address;
        this.listenerType = config.listenerType;
        const node = this;
        let listener = new Listener(node.host);

        node.status({ fill: "red", shape: "ring", text: "not listening" });

        this.on('input', function (msg) {
            try {
                if (typeof msg.nem === "undefined") {
                    msg.nem = {};
                }
                if (msg.nem.closeListener === "true") {
                    listener.close();
                    node.status({ fill: "red", shape: "ring", text: "connection closed" });
                }
                else {
                    listener.open().then(() => {
                        const addressMsg = node.address || msg.nem.address;
                        const address = Address.createFromRawAddress(addressMsg);
                        msg.nem.address = address;
                        listener[node.listenerType](address).subscribe((transaction) => {
                            msg.nem.transaction = transaction;
                            node.send(msg);
                        });
                        node.status({ fill: "green", shape: "dot", text: "connected" });
                    },
                        err => {
                            node.status({ fill: "red", shape: "ring", text: "error" });
                        }
                    );
                }
            }
            catch (e) {
                node.status({ fill: "red", shape: "dot", text: "error:" + e });
            }
        });
        node.on('close', function () {
            listener.close();
            node.status({ fill: "red", shape: "ring", text: "disconnected" });
        });
    }
    RED.nodes.registerType("listener", listener);
};
