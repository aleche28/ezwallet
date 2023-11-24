#!/bin/bash

sudo chown -R $(whoami):$(whoami) code/
cd code/
docker compose build
docker compose -p ezwallet up
