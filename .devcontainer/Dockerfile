FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

# System tools useful for Vite, GitHub auth, and Codex CLI
RUN apt-get update && apt-get install -y \
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
