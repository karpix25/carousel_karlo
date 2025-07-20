# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install system dependencies for Canvas
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    g++ \
    make \
    python3

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (изменили npm ci на npm install)
RUN npm install --production

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S carousel -u 1001

# Change ownership of the app directory
RUN chown -R carousel:nodejs /app

# Switch to non-root user
USER carousel

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
