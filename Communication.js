/*********************************************************************
 *                                                                   *
 *   Copyright 2016 Simon M. Werner                                  *
 *                                                                   *
 *   Licensed to the Apache Software Foundation (ASF) under one      *
 *   or more contributor license agreements.  See the NOTICE file    *
 *   distributed with this work for additional information           *
 *   regarding copyright ownership.  The ASF licenses this file      *
 *   to you under the Apache License, Version 2.0 (the               *
 *   "License"); you may not use this file except in compliance      *
 *   with the License.  You may obtain a copy of the License at      *
 *                                                                   *
 *      http://www.apache.org/licenses/LICENSE-2.0                   *
 *                                                                   *
 *   Unless required by applicable law or agreed to in writing,      *
 *   software distributed under the License is distributed on an     *
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY          *
 *   KIND, either express or implied.  See the License for the       *
 *   specific language governing permissions and limitations         *
 *   under the License.                                              *
 *                                                                   *
 *********************************************************************/

'use strict';

var CHANNEL_NAME = 'windvane';
var logger;

function Communication(callback, _logger) {

    logger = _logger;

    var DISCOVERY_PROXY_NAME = 'web-remote-control-proxy';
    var polo = require('polo')();
    polo.put({
        name: CHANNEL_NAME,
        port: 31234
    });

    var self = this;
    polo.on('up', function (name) {
        if (name === DISCOVERY_PROXY_NAME) {
            var proxyDetails = polo.get(DISCOVERY_PROXY_NAME);
            callback();
            self.createProxyConnection(proxyDetails);
        }
    });
    polo.on('error', function(err) {
        console.error('Polo: ', err);
    });

}

Communication.prototype.status = function(data) {
    this.toy.status(data);
};


Communication.prototype.createProxyConnection = function(proxyDetails) {

    // Don't initialise twice
    if (this.toy && this.toy.ping) return;

    var wrc = require('web-remote-control');
    var wrcOptions = { proxyUrl: proxyDetails.host,
                       channel: CHANNEL_NAME,
                       udp4: true,
                       tcp: false,
                       log: logger.debug
                   };

    this.toy = wrc.createToy(wrcOptions);

    // Should wait until we are registered before doing anything else
    this.toy.on('register', handleRegistered);

    // Ping the proxy and get the response time (in milliseconds)
    this.toy.ping(handlePing);

    this.toy.on('error', function (err) {
        logger.error(err);
        // logger.error('exiting process');
        // var exit = process.exit;
        // exit();
    });

};

function handlePing(time) {
    if (time > 0) {
        logger.info('COMMS:Ping time to proxy (ms):', time);
    }
}

function handleRegistered() {
    logger.info('COMMS:Registered with proxy server.');
}

module.exports = Communication;
