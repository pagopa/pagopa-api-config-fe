#!/usr/bin/env bash

# Recreate config file and assignment
echo "window._env_ = {" > ./src/env-config.js

# Loop on environment variables prefixed with
# apiconfig_ and add them to env-config.js
for apiconfig_var in $(env | grep -i apiconfig_); do
    varname=$(printf '%s\n' "$apiconfig_var" | sed -e 's/=.*//')
    varvalue=$(printf '%s\n' "$apiconfig_var" | sed -e 's/^[^=]*=//')

    echo "  $varname: \"$varvalue\"," >> ./src/env-config.js
done

echo "};" >> ./src/env-config.js
