// create an express app
const express = require("express")
const bodyParser = require('body-parser')
const app = express()
fs = require('fs');

// use the express-static middleware
app.use(express.static("public"))
/* Parse JSON data using body parser. */
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

// define the first route
app.get("/", function (req, res) {
  res.send("<h1>Hello World!</h1>")
})

app.post('/SaveToLog', function(req, res){
  // console.log(req.body);
  fs.appendFile('public/OrderCheckerLog.txt', req.body.logdata + '\r\n', function (err) {
    if (err) 
      return console.log(err);
    response = { status : "successed" };
    res.end(JSON.stringify(response));
  });
})


// start the server listening for requests
app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));