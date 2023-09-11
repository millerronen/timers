# Use the official Node.js image as the base image
FROM node:14

# Create a directory to store your application code
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your application will run on (adjust as needed)
EXPOSE 3000

# Define the command to start your application
CMD ["npm", "start"]
