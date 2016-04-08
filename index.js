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
 *          Configuration settings - need to be customised to requirements     *
 *                                                                             *
 *******************************************************************************/

var SENSOR_SAMPLE_RATE = 100;                       // How often we check the sensor samples (milliseconds)

var WINVANE_AIN = 'P9_33';

// Required for the compass to determine true north (from the magnetic
// declination).  The latitude / longitude values can be approximate.
var DEFAULT_LATITUDE = 174.2;
var DEFAULT_LONGITUDE = -36.4;
var geomagnetism = require('geomagnetism');
var geo = geomagnetism.model().point([DEFAULT_LONGITUDE, DEFAULT_LATITUDE]);
var declination = geo.decl;

/*******************************************************************************
 *                                                                             *
 *                           Load necessary libraries                          *
 *                                                                             *
 *******************************************************************************/

/* Set this for octalbonescript such that it does load capes automatically */
if (typeof process.env.AUTO_LOAD_CAPE === 'undefined') {
    process.env.AUTO_LOAD_CAPE = 0;
}
var obs = require('octalbonescript');
obs.loadCape('cape-universaln');
obs.loadCape('BB-ADC');

// This is required to initialise i2c-1 - currently used for the compass.
obs.i2c.open('/dev/i2c-1', 0x1e, function() {
    }, function(error) {
        if (error) {
            console.error(error.message);
        } else {
            console.log('Loaded i2c-1.');
        }
    }
);

var i2c = require('i2c-bus');
var async = require('async');
var util = require('./util');

// i2c-1 needs to be enabled at boot time.
var Compass = require('compass-hmc5883l');
var compass = new Compass(1, {
    i2c: i2c,
    sampleRate: '30',
    scale: '0.88',
    declination: declination
});

var Anemometer = require('./Anemometer');
var anemometer = new Anemometer(obs, WINVANE_AIN);

/*******************************************************************************
 *                                                                             *
 *                           Sensor collection code                            *
 *                                                                             *
 *******************************************************************************/

/**
 * This will asyncronously retreive the sensor data (gyro, accel and compass).
 * GPS data is not included since it is retreived only every second.
 */
collectData();
function collectData() {

    var startTime = new Date().getTime();

    async.parallel({
        compass: function (callback) {
            compass.getHeadingDegrees('x', 'y', callback);
        },
        compassRaw: compass.getRawValues.bind(compass),
        windSpeed: anemometer.getSpeed.bind(anemometer)
    }, function asyncResult(err, values) {

        var status;
        if (err) {
            console.error('asyncResult():', err);
            status = {
                error: err
            };
        } else {
            status = {
                compass: util.round(values.compass, 1),
                compassRaw: util.roundVector(values.compassRaw, 0),
            };
        }

        var now = new Date().getTime();
        var elapsedTime = now - startTime;
        setTimeout(collectData, SENSOR_SAMPLE_RATE - elapsedTime);

        if (!status.error) {
            var outputStr = now + '';
            outputStr += '\t' + util.vToStr(status.gyro);
            outputStr += '\t' + util.vToStr(status.accel);
            outputStr += '\t' + status.compass;
            outputStr += '\t' + util.vToStr(status.compassRaw);
            outputStr += '\t' + util.gpsToStr(status.gps);
            console.log(outputStr);
        }
    });
}
