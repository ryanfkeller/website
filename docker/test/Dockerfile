# Use Debian Bullseye as base
FROM node:20-bullseye

# Install GitHub CLI, git
RUN apt-get update && apt-get install -y \
    wget \
    git \
    ca-certificates \
    && mkdir -p -m 755 /etc/apt/keyrings \
    && wget -nv -O /etc/apt/keyrings/githubcli-archive-keyring.gpg https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install Jest globally
RUN npm install -g jest


# Set the working directory
WORKDIR /workspace

# Default command (keep the container alive for exec)
CMD ["sleep", "infinity"]