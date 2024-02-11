# Use a lightweight Node.js image
FROM node:20

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
