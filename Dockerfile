FROM node:22-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4174
WORKDIR /app
COPY --chown=node:node package.json package-lock.json index.html style.css icon.svg manifest.webmanifest sw.js icon-192.png icon-512.png icon-maskable.png ./
RUN npm ci --omit=dev --ignore-scripts --no-fund
COPY --chown=node:node src/ ./src/
COPY --chown=node:node server/ ./server/
COPY --chown=node:node scripts/cloud.mjs ./scripts/cloud.mjs
RUN mkdir -p /app/data && chown node:node /app/data
USER node
VOLUME /app/data
EXPOSE 4174
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4174)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "scripts/cloud.mjs"]
