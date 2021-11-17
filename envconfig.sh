#!/bin/bash

compgen -A variable | grep -q APICONFIG_ || export $(grep -v '^#' .env.local) ; chmod +x env.sh && . ./env.sh
