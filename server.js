// set up
var express    = require('express');
var app        = express();
var logger     = require('morgan');
var bodyParser = require('body-parser');
var cors       = require('cors');
var db         = require('./database');
const config   = require('./config'), { api: { port } } = config;

app.use(bodyParser.urlencoded({ extended: false })); // Parses urlencoded bodies
app.use(bodyParser.json()); // Send JSON responses
app.use(logger('dev')); // Log requests to API using morgan
app.use(cors());

// Routes
app.post('/api/units', function(req, res) {
  db.Unit.find({
    //name: req.body.roomType,
    reservations: {
      //Check if any of the dates the unit has been reserved for overlap with the requested dates
      $not: {
        $elemMatch: {start: {$lt: req.body.end}, end: {$gt: req.body.start}}
      }
    }
  }, function(err, rooms){
    if(err){
      res.send(err);
    } else {
      res.json(rooms);
    }
  });
});
app.post('/api/units/reserve', function(req, res) {
  console.log(req.body._id);
  db.Unit.findByIdAndUpdate(req.body._id, {
    $push: {
      reservations: {
        start: req.body.start,
        end: req.body.end
      }
    }
  }, {
    safe: true,
    new: true
  }, function(err, room){
    if(err){
      res.send(err);
    } else {
      res.json(room);
    }
  });
});

// listen
app.listen(8080);
console.log("api listening on port ${port}");