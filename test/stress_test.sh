#!/bin/bash

# Set the URL of your endpoint
URL="http://localhost:3000/api/timers"  # Replace with your actual URL

# Data for the POST request
DATA='{
  "hours": 0,
  "minutes": 0,
  "seconds": 10,
  "url": "https://webhook.site/ace0963e-99c1-4be7-87b2-99afadb8cb2d"
}'  # Replace with your desired data

# Loop to send 100 POST requests
for i in {1..100}; do
  curl -X POST -H "Content-Type: application/json" -d "$DATA" "$URL" &
done

# Wait for all requests to finish
wait
