FROM node:22-alpine
WORKDIR /preview
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY render.mjs mock.mjs serve.mjs ./
COPY img ./img
ENV THEME=/theme PORT=4000
EXPOSE 4000
CMD ["node", "serve.mjs"]
