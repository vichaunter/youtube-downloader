FROM jrottenberg/ffmpeg:3.3-alpine
FROM node:18-alpine

COPY --from=0 / /

RUN apk add --no-cache bash

WORKDIR /app

CMD ["yarn", "start"]