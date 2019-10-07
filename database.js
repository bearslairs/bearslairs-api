var mongoose   = require('mongoose'), Schema = mongoose.Schema;
var seedData   = require('./seed-data.json');
const config   = require('./config'), { db: { host, port, name, username, password } } = config;

// database connection
//const connectionString = `mongodb+srv://${username}:${password}@${host}:${port}/${name}?retryWrites=true&w=majority`;
const connectionString = 'mongodb://localhost:27017/bearslairs';
mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

// schemas
var UnitSizeSchema = new Schema({
  /*
  _unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    //required: true
  },
  */
  depth: Number,
  height: Number,
  width: Number
});
var DoorSizeSchema = new Schema({
  /*
  _unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    //required: true
  },
  */
  height: Number,
  width: Number
});
var UnitSchema = new Schema({
  _sector: {
    type: Schema.Types.ObjectId,
    ref: 'Sector',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  size: UnitSizeSchema,
  door: DoorSizeSchema/*,
  size: {
    type: Schema.Types.ObjectId,
    ref: 'UnitSize',
    required: true
  },
  door: {
    type: Schema.Types.ObjectId,
    ref: 'DoorSize',
    required: true
  },
  reservations: [
    {
      type: Schema.ObjectId,
      ref: 'Reservation'
    }
  ]
  */
});
var SectorSchema = new Schema({
  _facility: {
    type: Schema.Types.ObjectId,
    ref: 'Facility',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  units: [ /*UnitSchema*/
    { type: Schema.Types.ObjectId, ref: 'Unit' }
  ]
});
var FacilitySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  sectors: [ /*SectorSchema*/
    { type: Schema.Types.ObjectId, ref: 'Sector' }
  ]
});
/*
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
});
*/

// models
var Facility = mongoose.model('Facility', FacilitySchema, 'Facility');
var Sector = mongoose.model('Sector', SectorSchema, 'Sector');
var DoorSize = mongoose.model('DoorSize', DoorSizeSchema, 'DoorSize');
var UnitSize = mongoose.model('UnitSize', UnitSizeSchema, 'UnitSize');
var Unit = mongoose.model('Unit', UnitSchema, 'Unit');
//var Customer = mongoose.model('Customer', CustomerSchema, 'Customer');
//var Reservation = mongoose.model('Reservation', ReservationSchema, 'Reservation');

// initialise collections
Facility.countDocuments({}, function(err, count) {
  console.log('Facilities: ' + count);
  for(let fI = 0; fI < seedData.length; fI++) {
    seedData[fI].id = new mongoose.Types.ObjectId();
    for(let sI = 0; sI < seedData[fI].sectors.length; sI++) {
      seedData[fI].sectors[sI].id = new mongoose.Types.ObjectId();
      seedData[fI].sectors[sI]._facility = seedData[fI].id;
      for(let uI = 0; uI < seedData[fI].sectors[sI].length; uI++) {
        seedData[fI].sectors[sI].units[uI].id = new mongoose.Types.ObjectId();
        seedData[fI].sectors[sI].units[uI]._sector = seedData[fI].sectors[sI].id;
        seedData[fI].sectors[sI].units[uI].door.id = new mongoose.Types.ObjectId();
        seedData[fI].sectors[sI].units[uI].door.unitId = seedData[fI].sectors[sI].units[uI].id;
        seedData[fI].sectors[sI].units[uI].size.id = new mongoose.Types.ObjectId();
        seedData[fI].sectors[sI].units[uI].size.unitId = seedData[fI].sectors[sI].units[uI].id;
      }
    }
  }
  for(let i = 0; i < seedData.length; i++) {
    let facility = new Facility({
      _id: seedData[i].id,
      name: seedData[i].name,
      sectors: seedData[i].sectors.map(sector => new Sector({
        _id: sector.id,
        _facility: seedData[i].id,
        name: sector.name,
        units: sector.units.map(unit => new Unit({
          _id: unit.id,
          _sector: sector.id,
          name: unit.name,
          size: new UnitSize({
            _id: unit.size.id,
            _unit: unit.size.unitId,
            depth: unit.size.depth,
            height: unit.size.height,
            width: unit.size.width
          }),
          door: new DoorSize({
            _id: unit.door.id,
            _unit: unit.door.unitId,
            height: unit.door.height,
            width: unit.door.width
          })
        }))
      }))
    });
    facility.save(function(fE, fD) {
      if (fE) {
        console.error(fE);
      }
      console.log('created facility with id: ' + fD._id);
      for (let sI = 0; sI < facility.sectors.length; sI++) {
        let sector = facility.sectors[sI];
        sector.save(function(sE, sD) {
          if (sE) {
            console.error(sE);
          }
          console.log('created sector with id: ' + sD._id + ', in facility: ' + fD._id);
          for (let uI = 0; uI < sector.units.length; uI++) {
            let unit = sector.units[uI];
            unit.save(function(uE, uD) {
              if (uE) {
                console.error(uE);
              }
              console.log('created unit with id: ' + uD._id + ', in sector: ' + sD._id);
              /*
              let door = unit.door;
              door.save(function(dsE, dsD) {
                if (dsE) {
                  console.error(dsE);
                }
                console.log('created door size with id: ' + dsD._id + ', in unit: ' + uD._id);
              });
              let size = unit.size;
              size.save(function(usE, usD) {
                if (usE) {
                  console.error(usE);
                }
                console.log('created unit size with id: ' + usD._id + ', in unit: ' + uD._id);
              });
              */
            });
          }
        });
      }
    });
  }
});

module.exports = {
  facility: Facility,
  sector: Sector,
  doorSize: DoorSize,
  unitSize: UnitSize,
  unit: Unit/*,
  customer: Customer,
  reservation: Reservation
  */
};