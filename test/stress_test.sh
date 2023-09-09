#!/bin/bash

# Set the URL of your endpoint
URL="http://localhost:3000/timers"  # Replace with your actual URL

# Data for the POST request
DATA='{
  "hours": 0,
  "minutes": 0,
  "seconds": 5,
  "url": "https://ronenmiller.free.beeceptor.com"
}'  # Replace with your desired data

# Loop to send 100 POST requests
for i in {1..20}; do
  curl -X POST -H "Content-Type: application/json" -d "$DATA" "$URL" &
done

# Wait for all requests to finish
wait
