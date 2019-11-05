FROM node:8

WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm install -g forever

CMD forever bin/www
