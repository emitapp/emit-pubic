#!/bin/sh
#Not tested on Windows

echo "\n⚰️Disabling Codepush...\n"
sh bash_scripts/codepushFlipper.sh false

echo "\n🏗️Building...\n"
yarn run androidAssembleQARelease

echo "\n🧟Re-enabling Codepush...\n"
sh bash_scripts/codepushFlipper.sh true
