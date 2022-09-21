FROM debian:bullseye AS server

LABEL org.opencontainers.image.source "https://github.com/perfsee/perfsee"

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  DEBIAN_FRONTEND="noninteractive" \
  PATH=/root/.fnm:/root/.fnm/aliases/default/bin:$PATH

SHELL ["/bin/bash", "-c"]

RUN cat /etc/apt/sources.list && \
  apt-get update && \
  apt-get install procps curl unzip git libsecret-1-dev ca-certificates gnupg2 -y --no-install-recommends --fix-missing && \
  # https://github.com/Schniz/fnm
  curl -fsSL --insecure https://fnm.vercel.app/install | bash && \
  source ~/.bashrc && \
  fnm install --lts && \
  npm install yarn --location=global

FROM server AS runner
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
RUN curl -sS https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
  apt-get update && \
  apt-get install xvfb libjpeg-dev ffmpeg google-chrome-stable -y --no-install-recommends --fix-missing

FROM runner AS develop
ENV RUSTUP_HOME=/usr/local/rustup \
  CARGO_HOME=/usr/local/cargo \
  PATH=/usr/local/cargo/bin:$PATH
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

FROM ghcr.io/perfsee/perfsee/develop:latest as compose_develop
ADD . /code
WORKDIR /code
RUN yarn

FROM ghcr.io/perfsee/perfsee/runner:latest AS deploy
ADD . /code
WORKDIR /code
RUN yarn && yarn build
CMD ["node", "-r", "./tools/paths-register", "packages/platform-server/dist/index.js"]

FROM ghcr.io/perfsee/perfsee/server:latest as runner_deploy
ADD . /code
WORKDIR /code
RUN yarn && yarn build
CMD ["node", "-r", "./tools/paths-register", "packages/job-runner/dist/index.js"]
