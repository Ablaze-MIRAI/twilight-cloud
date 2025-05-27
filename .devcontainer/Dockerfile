FROM node:22

RUN apt-get update \
 && apt-get install -y \
    git \
    openssh-client \
    curl

ENV DENO_INSTALL=/usr/local
RUN curl -fsSL https://deno.land/x/install/install.sh | sh