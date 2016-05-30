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

var logger = require('./logger');

/**
 * This module gets the time via a GPS device.  It will use GPS PMTK commands to set the GPS device to Output
 * ZDA - date / time information.
 */

function GPS_Time(port, baud) {

    this.time = null;
    this.port = port;
    this.baud = baud || 9600;

    //
    // Set up the GPS parser
    //
    this.initGPSparser();

    //
    // Set up GPS to return time
    //
    var self = this;
    this.setZDA(function (err) {
        if (err) {
            logger.error('ERROR: GPS_Time(): unable to init GPS to ZDA: ', err);
        } else {
            self.startCapturing();
        }
    });

}

/**
 * Configure the GPS device to return ZDA NMEA messages.
 * @param  {string}   port     the serial port
 * @param  {number}   baud     The baud rate
 * @param  {Function} callback Once done this gets called
 */
GPS_Time.prototype.setZDA = function(callback) {

    var PMTK = require('pmtk');
    var pmtk = new PMTK(this.port, this.baud, function (err) {
        if (err) {
            callback(err);
        } else {
            pmtk.commands.setNmeaOutput(['ZDA'], callback);
        }
    });

};

/**
 * Set up the serial port listener
 * @return {[type]} [description]
 */
GPS_Time.prototype.startCapturing = function() {
    var SerialPort = require('serialport');
    var self = this;
    this.serial = new SerialPort.SerialPort(this.port, {
        baudrate: this.baud,
        parser: SerialPort.parsers.readline('\r\n')
    });
    this.serial.on('data', function (data) {
        self.gps.update(data);
    });

};

GPS_Time.prototype.initGPSparser = function () {
    var GPS = require('gps');
    this.gps = new GPS();
    var self = this;
    this.gps.on('data', function (parsedData) {
        if (parsedData && parsedData.time) {
            logger.debug('GPS Data: ', parsedData);
            self.time = parsedData.time;
        } else {
            self.time = undefined;
        }
    });
};

GPS_Time.prototype.getTime = function () {
    return this.time;
};

module.exports = GPS_Time;
