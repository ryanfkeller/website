# Use Debian Bullseye as base
FROM node:20-bullseye

# Set the working directory
WORKDIR /workspace

# Initialize package.json and install project dependencies
RUN npm install --save-dev jest @octokit/rest prettier

# Default command (keep the container alive for exec)
CMD ["sleep", "infinity"]