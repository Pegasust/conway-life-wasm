FROM rust:alpine3.16 AS builder
LABEL maintainer="Pegasust <pegasucksgg@gmail.com>"
LABEL version="0.1"

WORKDIR /usr/src/myapp
COPY . .

# Couple of dependencies we'll need to take care off
RUN apk add --update --no-cache musl-dev curl nodejs npm && \
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh && \
    npm install -g rollup && rustup update nightly && rustup default nightly

# Build
## Install the packages we have (and hopefully this triggers Dockerfile cache)
RUN cargo check
## Build & bundle wasm
RUN cd packages/web-app &&\
    wasm-pack build --target web --out-name web-app --release &&\
    rollup public/index.js --format iife --file pkg/bundle.js
## Front-end: change pretty often. Doesn't require rebuild.
RUN cd packages/web-app && cp public/index.html pkg/ && cp -r pkg ../../
 
# our output directory is /usr/src/myapp/pkg

FROM nginx:stable

COPY --from=builder /usr/src/myapp/pkg /usr/share/nginx/html

