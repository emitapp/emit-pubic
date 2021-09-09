#!/bin/sh
#Runs the RN server on port 8081 (defualt) if its not running

#https://www.cyberciti.biz/faq/unix-linux-check-if-port-is-in-use-command/
PORT_STATUS=$(sudo lsof -i:8081) #Probably not a great idea to use sudo but whatever
if [ -z "$PORT_STATUS" ]
then
      echo "Starting server!"
      react-native start
else
      echo "Port 8081 already in use, assuming server is already running"
fi