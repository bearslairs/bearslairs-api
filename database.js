var mongoose   = require('mongoose'), Schema = mongoose.Schema;
var seedData   = require("./seed-data.json");
const config   = require('./config'), { db: { host, port, name, username, password } } = config;

// database connection
const connectionString = `mongodb+srv://${username}:${password}@${host}:${port}/${name}?retryWrites=true&w=majority`;
mongoose.connect(connectionString);

// schemas
var FacilitySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  sectors: [
    {
      type: Schema.ObjectId,
      ref: 'Sector'
    }
  ]
});
var SectorSchema = new Schema({
  _facility: {
    type: Schema.ObjectId,
    ref: 'Facility',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  units: [
    {
      type: Schema.ObjectId,
      ref: 'Unit'
    }
  ]
});
var UnitSizeSchema = new Schema({
  _unit: {
    type: Schema.ObjectId,
    ref: 'Unit',
    required: true
  },
  depth: Number,
  height: Number,
  width: Number
});
var DoorSizeSchema = new Schema({
  _unit: {
    type: Schema.ObjectId,
    ref: 'Unit',
    required: true
  },
  height: Number,
  width: Number
});
var UnitSchema = new Schema({
  _sector: {
    type: ObjectId,
    ref: 'Sector',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  size: {
    type: UnitSizeSchema,
    required: true
  },
  door: {
    type: DoorSizeSchema,
    required: true
  },
  reservations: [
    {
      type: Schema.ObjectId,
      ref: 'Reservation'
    }
  ]
});
var CustomerSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  telephone: {
    type: String,
    required: true
  },
  reservations: [
    {
      type: Schema.ObjectId,
      ref: 'Reservation'
    }
  ]
});
var ReservationSchema = new Schema({
  _customer : { type: Schema.ObjectId, ref: 'Customer' },
  _unit : { type: Schema.ObjectId, ref: 'Unit' },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  }
    //fans     : [{ type: Schema.ObjectId, ref: 'Person' }]
});

// models
var Facility = mongoose.model('Facility', FacilitySchema, 'Facility');
var Sector = mongoose.model('Sector', SectorSchema, 'Sector');
var DoorSize = mongoose.model('DoorSize', DoorSizeSchema, 'DoorSize');
var UnitSize = mongoose.model('UnitSize', UnitSizeSchema, 'UnitSize');
var Unit = mongoose.model('Unit', UnitSchema, 'Unit');
var Customer = mongoose.model('Customer', CustomerSchema, 'Customer');
var Reservation = mongoose.model('Reservation', ReservationSchema, 'Reservation');

// initialise collections
Facility.count({}, function(err, count){
  console.log("Facilities: " + count);
  for(var i = 0; i < seedData.length; i++) {
    var facility = new Facility({
      name: seedData[i].name
      sectors: seedData[i].sectors.map(sector => new Sector({
        name: sector.name,
        units: sector.units.map(unit => new Unit({
          name: unit.name,
          size: new UnitSize({
            depth: unit.size.depth,
            height: unit.size.height,
            width: unit.size.width,
          }),
          door: new DoorSize({
            height: unit.door.height,
            width: unit.door.width,
          })
        }))
      }))
    });
    facility.save(function(err, doc){
      console.log("created facility with id: " + doc._id);
    });
  }
});

module.exports = {
  facility: Facility,
  sector: Sector,
  doorSize: DoorSize,
  unitSize: UnitSize,
  unit: Unit,
  customer: Customer,
  reservation: Reservation,
};