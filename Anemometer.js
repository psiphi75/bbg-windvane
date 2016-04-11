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

/**
 * Anemometer function with initialisation parameters.
 * @param {object} obs    The initialised octalbonescript object.
 * @param {string} pin    The BeagleBone pin to use.
 * @param {number} scaler (optional) The scale factor to use.
 * @param {number} averageCount (optional) The number samples to take.
 * @param {number} averageSampleRate (optional) The average time to take the samples across (ms).
 */
function Anemometer(obs, pin, scaler, averageCount, averageSampleRate) {
    if (typeof obs !== 'object' || typeof obs.pinMode !== 'function') {
        throw new Error('Anemometer: Error: Expecting octalbonescript to be defined');
    }

    this.obs = obs;
    this.pin = pin;
    this.scaler = scaler || 1;
    this.averageCount = averageCount || 1;
    this.averageSampleRate = averageSampleRate || 10;
}
Anemometer.prototype.getWindSpeed = function getWindSpeed(callback) {
    var self = this;
    var callCount = 0;
    var averageVoltage = 0;
    var startTime = 0;

    getAverageVoltage();

    function getAverageVoltage() {
        var now = new Date().getTime();
        var elapsedTime = now - startTime;

        setTimeout(function() {
            startTime = new Date().getTime();
            self.obs.analogRead(self.pin, handleAnalogRead);
        }, self.averageSampleRate - elapsedTime);
    }

    function handleAnalogRead(err, voltage) {

        if (err) {
            callback(err);
            return;
        }

        callCount += 1;
        averageVoltage += voltage;
        if (callCount >= self.averageCount) {
            // We are done
            averageVoltage /= callCount;
            averageVoltage *= self.scaler;
            var windSpeed = convertVoltageToWindSpeed(averageVoltage);
            callback(null, windSpeed);
        } else {
            // We need more samples
            getAverageVoltage();
        }
    }

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
