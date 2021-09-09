#!/bin/sh
#This is for starting the metro server and the ios emulator
#Useful when you're doing just JS work and don't need a whole new build

#https://developer.android.com/studio/run/emulator-commandline
echo "Running ios Emulator"

open -a Simulator.app #& #Runs in the background

echo "Starting Metro server"

yarn run startServer 