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

/*******************************************************************************
 *                                                                             *
 *                           Sensor collection code                            *
 *                                                                             *
 *******************************************************************************/

// Product page: https://www.adafruit.com/products/1733
// Datasheet: https://cdn-shop.adafruit.com/product-files/1733/C2192+datasheet.pdf

function Anemometer(obs, pin) {
    if (typeof obs !== 'object' || typeof obs.pinMode !== 'function') {
        throw new Error('Anemometer: Error: Expecting octalbonescript to be defined');
    }

    this.obs = obs;
    this.pin = pin;
}
Anemometer.prototype.getWindSpeed = function getWindSpeed(callback) {
    this.obs.analogRead(this.pin, function(err, voltage) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, convertVoltageToWindSpeed(voltage));
    });
};

function convertVoltageToWindSpeed(voltage) {
    // Wind @ 0 m/s -> 0.4V
    // Wind @ 32.4 m/s -> 2V
    // Using:  WindSpeed = m * Voltage + c
    var m = 20.25;
    var c = -8.1;
    return m * voltage + c;
}

module.exports = Anemometer;
