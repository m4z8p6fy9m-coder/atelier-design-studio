FROM node:22-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4174
WORKDIR /app
COPY --chown=node:node package.json package-lock.json index.html style.css icon.svg ./
RUN npm ci --omit=dev --ignore-scripts --no-fund
COPY --chown=node:node src/ ./src/
COPY --chown=node:node server/ ./server/
COPY --chown=node:node scripts/cloud.mjs ./scripts/cloud.mjs
RUN mkdir -p /app/data && chown node:node /app/data
USER node
VOLUME /app/data
EXPOSE 4174
CMD ["node", "scripts/cloud.mjs"]
