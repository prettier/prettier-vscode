# See here for image contents: https://github.com/devcontainers/images/tree/main/src/typescript-node

# [Choice] Node.js version: 22, 20, 18 (use -bookworm or -bullseye variants)
ARG VARIANT="22-bookworm"
FROM mcr.microsoft.com/devcontainers/typescript-node:${VARIANT}

# Install PHP for Prettier PHP plugin testing
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends php \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
