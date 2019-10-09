var mongoose   = require('mongoose'), Schema = mongoose.Schema;
var seedData   = require('./seed-data.json');
const config   = require('./config'), { db: { host, port, name, username, password } } = config;

// database connection
//const connectionString = `mongodb+srv://${username}:${password}@${host}:${port}/${name}?retryWrites=true&w=majority`;
const connectionString = 'mongodb://localhost:27017/bearslairs';
mongoose.connect(connectionString, { replicaSet: 'rs0', useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.dropDatabase();

// schemas
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
      type: Schema.Types.ObjectId,
      ref: 'Reservation'
    }
  ]
});
var ReservationSchema = new Schema({
  /*
  _customer : {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  _unit : {
    type: Schema.Types.ObjectId,
    ref: 'Unit'
  },
  */
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  }
});
var UnitSizeSchema = new Schema({
  depth: Number,
  height: Number,
  width: Number
});
var DoorSizeSchema = new Schema({
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
  door: DoorSizeSchema,
  reservations: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Reservation'
    }
  ]
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
    {
      type: Schema.Types.ObjectId,
      ref: 'Unit'
    }
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

var model = {
  Facility: mongoose.model('Facility', FacilitySchema, 'Facility'),
  Sector: mongoose.model('Sector', SectorSchema, 'Sector'),
  DoorSize: mongoose.model('DoorSize', DoorSizeSchema, 'DoorSize'),
  UnitSize: mongoose.model('UnitSize', UnitSizeSchema, 'UnitSize'),
  Unit: mongoose.model('Unit', UnitSchema, 'Unit'),
  Customer: mongoose.model('Customer', CustomerSchema, 'Customer'),
  Reservation: mongoose.model('Reservation', ReservationSchema, 'Reservation')
};

model.Facility.countDocuments({}, function(err, count) {
  console.log('Facility count: ' + count);
});
model.Sector.countDocuments({}, function(err, count) {
  console.log('Sector count: ' + count);
});
model.Unit.countDocuments({}, function(err, count) {
  console.log('Unit count: ' + count);
});
model.Customer.countDocuments({}, function(err, count) {
  console.log('Customer count: ' + count);
});
model.Reservation.countDocuments({}, function(err, count) {
  console.log('Reservation count: ' + count);
});

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

model.Unit.watch().on('change', (change) => {
  if (change.operationType === 'insert') {
  }
});

// initialise collections
model.Facility.countDocuments({}, function(err, count) {
  // todo: implement a smarter condition than count to determine if the database should be seeded.
  if (count < seedData.facilities.length) {
    console.log('seeding database...');

    for(let fI = 0; fI < seedData.facilities.length; fI++) {
      seedData.facilities[fI].id = new mongoose.Types.ObjectId();
      for(let sI = 0; sI < seedData.facilities[fI].sectors.length; sI++) {
        seedData.facilities[fI].sectors[sI].id = new mongoose.Types.ObjectId();
        seedData.facilities[fI].sectors[sI]._facility = seedData.facilities[fI].id;
        for(let uI = 0; uI < seedData.facilities[fI].sectors[sI].length; uI++) {
          seedData.facilities[fI].sectors[sI].units[uI].id = new mongoose.Types.ObjectId();
          seedData.facilities[fI].sectors[sI].units[uI]._sector = seedData.facilities[fI].sectors[sI].id;
          seedData.facilities[fI].sectors[sI].units[uI].door.id = new mongoose.Types.ObjectId();
          seedData.facilities[fI].sectors[sI].units[uI].door.unitId = seedData.facilities[fI].sectors[sI].units[uI].id;
          seedData.facilities[fI].sectors[sI].units[uI].size.id = new mongoose.Types.ObjectId();
          seedData.facilities[fI].sectors[sI].units[uI].size.unitId = seedData.facilities[fI].sectors[sI].units[uI].id;
        }
      }
    }
    for(let fI = 0; fI < seedData.facilities.length; fI++) {
      let facility = new model.Facility({
        _id: seedData.facilities[fI].id,
        name: seedData.facilities[fI].name,
        sectors: seedData.facilities[fI].sectors.map(sector => new model.Sector({
          _id: sector.id,
          _facility: seedData.facilities[fI].id,
          name: sector.name,
          units: sector.units.map(unit => new model.Unit({
            _id: unit.id,
            _sector: sector.id,
            name: unit.name,
            size: new model.UnitSize({
              _id: unit.size.id,
              _unit: unit.size.unitId,
              depth: unit.size.depth,
              height: unit.size.height,
              width: unit.size.width
            }),
            door: new model.DoorSize({
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
        console.log(`facility created:  ${fD.name}, with id: ${fD._id}.`);
        for (let sI = 0; sI < facility.sectors.length; sI++) {
          let sector = facility.sectors[sI];
          sector.save(function(sE, sD) {
            if (sE) {
              console.error(sE);
            }
            console.log(`sector created:  ${fD.name}/${sD.name}, with id: ${sD._id}.`);
            for (let uI = 0; uI < sector.units.length; uI++) {
              let unit = sector.units[uI];
              unit.save(function(uE, uD) {
                if (uE) {
                  console.error(uE);
                }
                console.log(`unit created: ${fD.name}/${sD.name}/${uD.name}, with id: ${uD._id}.`);
              });
            }
          });
        }
      });
    }
  }
});

model.Customer.countDocuments({}, function(err, count) {
  // todo: implement a smarter condition than count to determine if the database should be seeded.
  if (count < seedData.customers.length) {
    for(let cI = 0; cI < seedData.customers.length; cI++) {
      let customer = new model.Customer({
        name: seedData.customers[cI].name,
        email: seedData.customers[cI].email,
        telephone: seedData.customers[cI].telephone,
        reservations: []
      });
      customer.save(function(cE, cD) {
        if (cE) {
          console.error(cE);
        }
        console.log(`customer created:  ${cD.name}, with id: ${cD._id}.`);
      });
    }
  }
});


function getRandomSizeInMetres(min, max) {
  return Number.parseFloat(Math.random() * (max - min) + min).toFixed(2);
}
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
model.Reservation.countDocuments({}, function(err, count) {
  for (let reservationAttempts = 0; reservationAttempts < 500; reservationAttempts++) {
    sleep(500).then(() => {
      let start = (new Date()).addDays(1 + Math.floor(Math.random() * 364));
      let want = {
        size: {
          depth: getRandomSizeInMetres(1, 3),
          height: getRandomSizeInMetres(1, 3),
          width: getRandomSizeInMetres(1, 3)
        },
        door: {
          height: getRandomSizeInMetres(1, 2),
          width: getRandomSizeInMetres(0.5, 2)
        },
        start: start,
        end: start.addDays(1 + Math.floor(Math.random() * 364))
      };

      model.Unit.findOne(
        {
          "size.depth": {
            $gt: want.size.depth
          },
          "size.height": {
            $gt: want.size.height
          },
          "size.width": {
            $gt: want.size.width
          },
          "door.height": {
            $gt: want.door.height
          },
          "door.width": {
            $gt: want.door.width
          },
          reservations: {
            $not: {
              $elemMatch: {
                start: {
                  $lt: want.end
                },
                end: {
                  $gt: want.start
                }
              }
            }
          }
        },
        function (ruE, reservableUnit) {
          if (ruE) {
            console.log(`reservable unit (${want.size.depth} × ${want.size.height} × ${want.size.width}) not found.`);
          } else {
            //console.log(`reservation created for: ${reservation.start} to ${reservation.end}, in unit: ${reservableUnit.name}, for customer: ${randomCustomer.name}, with id: ${rD._id}.`);
            console.log(`reservable unit (${want.size.depth} × ${want.size.height} × ${want.size.width}) found with id: ${reservableUnit._id}.`);

            // select a random customer for our generated reservation
            model.Customer.countDocuments({}, function(cdE, customerCount) {
              if (customerCount > 0) {
                model.Customer.findOne().skip(Math.floor(Math.random() * customerCount)).exec(
                  function (foE, randomCustomer) {

                    // generate a random reservation
                    let start = (new Date()).addDays(1 + Math.floor(Math.random() * 364));
                    let reservation = new model.Reservation({
                      _id: new mongoose.Types.ObjectId(),
                      start: start,
                      end: start.addDays(1 + Math.floor(Math.random() * 364))
                    });
                    reservation.save(function(rE, rD) {
                      if (rE) {
                        console.error(rE);
                      }
                      model.Customer.update(
                        { _id: randomCustomer._id }, 
                        { $push: { reservations: rD._id } },
                        function (cuE, cuC) {
                          if (cuE) {
                            console.error(cuE);
                          }
                          console.log(`reservation: ${rD._id} associated with customer: ${randomCustomer._id}`);
                        }
                      );
                      model.Unit.update(
                        { _id: reservableUnit._id },
                        { $push: { reservations: rD._id } },
                        function (uuE, uuC) {
                          if (uuE) {
                            console.error(uuE);
                          }
                          console.log(`reservation: ${rD._id} associated with unit: ${reservableUnit._id}`);
                        }
                      );
                      console.log(`reservation created for: ${reservation.start} to ${reservation.end}, in unit: ${reservableUnit.name}, for customer: ${randomCustomer.name}, with id: ${rD._id}.`);
                    });
                  }
                );
              }
            });
          }
        }
      );
    });
  }
});
module.exports = model;