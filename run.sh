#!/bin/bash

ROOT=$(readlink -f $(dirname $0))

DATA_DIR=$ROOT/data

mkdir -p $DATA_DIR

docker run -d -p 6379:6379 -v $DATA_DIR:/data --name redis dockerfile/redis

docker run -p 127.0.0.1:7777:7777 --link redis:redis wdtz/hastebin

docker stop redis
docker rm redis
