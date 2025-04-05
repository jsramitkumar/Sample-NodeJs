# Start with the official Node.js image
FROM node:18-alpine

# Create a non-root user for security
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy application code with proper permissions
COPY --chown=nodeapp:nodeapp . .

# Use non-root user for security
USER nodeapp

# Expose the port the app runs on
EXPOSE 3000

# Set production environment
ENV NODE_ENV production

# Command to run the application
CMD ["node", "app.js"]