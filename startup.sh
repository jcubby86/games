#!/bin/sh
cd /etc/data/front-end
npm ci
npm run build
cd ../back-end
npm ci
node server.js
