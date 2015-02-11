# Hastebin on Docker
# VERSION               0.1
# Based on https://registry.hub.docker.com/u/jmvrbanac/hastebin/dockerfile/

FROM node
MAINTAINER Will Dietz <w@wdtz.org>

RUN apt-get update && apt-get upgrade -qqy

# One or the other
RUN git clone https://github.com/dtzWill/haste-server.git /opt/haste
# COPY . /opt/haste/

WORKDIR /opt/haste
RUN ["npm", "install"]
ADD config.js /opt/haste/config.js

EXPOSE 7777
CMD ["npm", "start"]
