FROM mcr.microsoft.com/devcontainers/javascript-node:5-24-trixie

RUN dpkg --compare-versions "$(node --print process.versions.node)" ge 24.22.1

# System tools useful for Vite, GitHub auth, and Codex CLI
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    git \
    curl \
    jq \
    ca-certificates \
    ripgrep \
    fd-find \
    && rm -rf /var/lib/apt/lists/*

# Install Codex CLI
# Official install path is: npm install -g @openai/codex
RUN npm install -g @openai/codex

USER node

WORKDIR /workspaces
