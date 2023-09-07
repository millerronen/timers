const express = require("express");
const bodyParser = require("body-parser");
const timerRoutes = require("./routes/timerRoutes");

const app = express();

app.use(bodyParser.json());
app.use("/api", timerRoutes); // Define a base path for your API

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
