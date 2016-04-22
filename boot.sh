#!/bin/bash

#####################################################################
#                                                                   #
#   Copyright 2016 Simon M. Werner                                  #
#                                                                   #
#   Licensed to the Apache Software Foundation (ASF) under one      #
#   or more contributor license agreements.  See the NOTICE file    #
#   distributed with this work for additional information           #
#   regarding copyright ownership.  The ASF licenses this file      #
#   to you under the Apache License, Version 2.0 (the               #
#   "License"); you may not use this file except in compliance      #
#   with the License.  You may obtain a copy of the License at      #
#                                                                   #
#      http://www.apache.org/licenses/LICENSE-2.0                   #
#                                                                   #
#   Unless required by applicable law or agreed to in writing,      #
#   software distributed under the License is distributed on an     #
#   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY          #
#   KIND, either express or implied.  See the License for the       #
#   specific language governing permissions and limitations         #
#   under the License.                                              #
#                                                                   #
#####################################################################

#
# Start the BeagleBone Windvane at boot time
#

#
# Need to install forever (npm install -g forever)
#

# go to the working directory of the script
cd "$(dirname "$0")"

/usr/local/bin/forever start  \
    --append                  \
    --watchDirectory ./       \
    -l ../windvane.log        \
    -e ../windvane.errors     \
    --uid "vane"              \
     index.js