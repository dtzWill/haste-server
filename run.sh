#!/bin/bash

ROOT=$(readlink -f $(dirname $0))

DATA_DIR=$ROOT/data

DBNAME=haste-redis

mkdir -p $DATA_DIR

docker run -d -v $DATA_DIR:/data --name $DBNAME redis redis-server --appendonly yes

docker run --rm -p 127.0.0.1:7777:7777 --name dtzso --link $DBNAME:redis wdtz/hastebin

docker stop $DBNAME
docker rm $DBNAME
