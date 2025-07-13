# Build npmrun
FROM rust:1-alpine as npmrun-builder
WORKDIR /src

RUN apk add --no-cache git alpine-sdk

RUN git clone https://github.com/nexryai/npmrun.git .
RUN cargo build --release


# ビルド用
FROM node:24-alpine as builder
RUN apk add --no-cache ca-certificates git libressl libressl-dev

WORKDIR /app

## パッケージをインストール
COPY . ./
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm build

FROM node:24-alpine as prod_dependencies
RUN apk add --no-cache ca-certificates git libressl libressl-dev

WORKDIR /app

COPY . ./
RUN npm install -g pnpm
RUN pnpm install --prod --frozen-lockfile

# 実行用
# 本来なら3.21を使いたいが、Prisma側のバグにより起動しなくなるため3.20で固定する
# https://github.com/prisma/prisma/issues/25817
FROM node:24-alpine

RUN apk add --no-cache ca-certificates tini \
	&& addgroup -g 720 app \
	&& adduser -u 720 -G app -D -h /app app

WORKDIR /app

## ビルド用のレイヤからコピーする
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json .
COPY --from=prod_dependencies /app/node_modules ./node_modules
COPY --chown=app:app prisma ./prisma
COPY --from=npmrun-builder /src/target/release/npmrun /usr/local/bin/npmrun

USER app
ENV NODE_ENV=production
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npmrun", "docker:start"]
