# # Use a lightweight Node.js image
# FROM node:20

# # Set the working directory in the container
# WORKDIR /app

# # Copy package.json and package-lock.json to the working directory
# COPY package*.json .

# # Install dependencies
# RUN npm install

# # Copy the rest of the application files to the working directory
# COPY . .

# # Expose port 5000 (assuming your application listens on this port)
# EXPOSE 5000

# # Command to run the application
# CMD ["npm", "start"]

# Stage 1: Build stage
FROM node:20 AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json .

# Install dependencies
RUN npm install

# Copy the rest of the application files to the working directory
COPY . .

# Expose port 5000 (assuming your application listens on this port)
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]

# Stage 2: Test stage
FROM builder AS test
# Add any test-related configurations or commands here

# Stage 3: Production stage
FROM builder AS prod
# Define any production-specific configurations or optimizations here

