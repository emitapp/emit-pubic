#!/bin/sh
#Not tested on Windows
#Optinal: the path to check, defaults to .
echo $(pwd)

# https://askubuntu.com/questions/623933/how-to-create-a-rotation-animation-using-shell-script
spinner() {
    local i sp n
    sp='/-\|'
    n=${#sp}
    printf ' '
    while sleep 0.1; do
        printf "%s\b" "${sp:i++%n:1}"
    done
}

echo "Eslint usually takes a bit..."
spinner &
spinner_pid=$!

eslint --ext js,jsx,ts,tsx --max-warnings 0 .;
ESLINT_EXIT_CODE=$?;

kill $spinner_pid &>/dev/null

tsc;
TSC_EXIT_CODE=$?;

if [[ $ESLINT_EXIT_CODE = 0 && $TSC_EXIT_CODE = 0 ]]
then
    echo "✅ All is good!"
else
    echo "❌ Looks like you have more work to do!."
fi