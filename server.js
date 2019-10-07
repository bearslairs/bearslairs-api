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
app.post('/api/rooms', function(req, res) {
  db.Unit.find({
    type: req.body.roomType,
    beds: req.body.beds,
    max_occupancy: {$gt: req.body.guests},
    cost_per_night: {$gte: req.body.priceRange.lower, $lte: req.body.priceRange.upper},
    reserved: {
      //Check if any of the dates the room has been reserved for overlap with the requsted dates
      $not: {
        $elemMatch: {from: {$lt: req.body.to.substring(0,10)}, to: {$gt: req.body.from.substring(0,10)}}
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
app.post('/api/rooms/reserve', function(req, res) {
  console.log(req.body._id);
  db.Unit.findByIdAndUpdate(req.body._id, {
      $push: {"reserved": {from: req.body.from, to: req.body.to}}
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
app.listen(${port});
console.log("api listening on port ${port}");