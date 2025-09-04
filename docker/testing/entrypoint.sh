#!/bin/sh
set -e

# Copy test configs into root
cp /workspace/docker/testing/package.testing.json /workspace/package.json
cp /workspace/docker/testing/jest.config.testing.js /workspace/jest.config.js

exec "$@"