#!/bin/bash

# Set the URL of your endpoint
URL="http://localhost:3000/api/timers"  # Replace with your actual URL

# Data for the POST request
DATA='{
  "hours": 0,
  "minutes": 0,
  "seconds": 10,
  "url": "https://hooks.zapier.com/hooks/catch/16455112/3rty6vk/"
}'  # Replace with your desired data

# Loop to send 100 POST requests
for i in {1..100}; do
  curl -X POST -H "Content-Type: application/json" -d "$DATA" "$URL" &
done

# Wait for all requests to finish
wait
