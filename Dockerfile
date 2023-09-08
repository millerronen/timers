# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Install MySQL client libraries and project dependencies
RUN apt-get update && apt-get install -y mysql-client && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port your Node.js app is listening on (if applicable)
EXPOSE 3000

# Define the command to run your Node.js application
CMD [ "node", "app.js" ]
