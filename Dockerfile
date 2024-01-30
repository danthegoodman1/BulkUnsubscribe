FROM node:lts-slim as base
WORKDIR /app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json package-lock.json /temp/dev/
RUN cd /temp/dev && npm i

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json package-lock.json /temp/prod/
RUN cd /temp/prod && npm i --only=production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
ENV NODE_ENV=production
# RUN bun test
RUN npm run build

# copy production dependencies and source code into final image
FROM base AS release

RUN apt update
RUN apt install wget -y
RUN wget https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.deb
RUN dpkg -i litestream-v0.3.13-linux-amd64.deb

COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/src ./src
COPY --from=prerelease /app/build ./build
COPY --from=prerelease /app/public ./public
COPY . .

RUN chown node /app
USER node
CMD [ "litestream", "replicate", "-exec", "npm start"]
