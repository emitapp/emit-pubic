#!/bin/sh
#This is for starting the metro server and the Android emulator
#Useful when you're doing just JS work and don't need a whole new build

#https://developer.android.com/studio/run/emulator-commandline
echo "Running AVD - will choose first emulator in avd list"

AVD=$(emulator -list-avds | sed -n 1p)

emulator -avd $AVD & #Runs in the background

echo "Starting Metro server"

yarn run startServer 