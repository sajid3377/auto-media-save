# Dockerfile for auto-media-save
# Builds a small Node.js image to run the Express server

FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose port (Render sets PORT env var automatically)
EXPOSE 3000

# Use environment PORT if provided by Render; default 3000
CMD ["node", "server.js"]
