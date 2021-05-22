#!/bin/sh
#Not tested on Windows
#Just needs one argument -> "true" or "false"
#expected working directory:

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <true or false>" >&2
  exit 1
fi

if [ $1 != "true" ] && [ $1 != "false" ]; then
  echo "Invalid first argument." >&2
  exit 1
fi

set -e #So that the sctipt exits if the awk script fails...
codepushsettingsfilepath='src/_dev/index.js'
awkscript='
        BEGIN {
            foundTarget = 0
            targetPrevLine = 0
        }
        {
            if(/\/\/AWK_LINE_BELOW:1/){
                foundTarget = 1
                targetPrevLine = 1
            }
            else if (targetPrevLine == 1){ 
                if (arg == "false") {sub("true", "false")}
                else if (arg == "true") {sub("false", "true")}
                targetPrevLine = 0
            }

            {print}
        }

        END {
                if (foundTarget == 0) {
                    print "\n🛑Problem! Could not find trigger. Was the file edited recently?\n" | "cat 1>&2"
                    exit 1
                }
        }'

tmpfile=$(mktemp)
awk -v arg=$1 "$awkscript" "$codepushsettingsfilepath" > "$tmpfile" && mv "$tmpfile" "$codepushsettingsfilepath"