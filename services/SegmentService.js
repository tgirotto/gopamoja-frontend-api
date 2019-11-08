const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');
const env = require('../env.js');

const HttpService = require('../services/HttpService');

const SegmentService = {
  findByOriginIdAndDestinationIdAndDate: async (originId, destinationId, date) => {
    if(isNaN(originId)) {
      throw "Origin id invalid"
    }

    if(isNaN(destinationId)) {
      throw "Destination id invalid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "select * from stops where id = $1";

      result = await client.query(q0, [originId]);

      if(result == null || result.rows == null) {
        throw "Stops get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Stop not found";
      }

      let origin = result.rows[0];

      let q1 = "select * from stops where id = $1";

      result = await client.query(q1, [destinationId]);

      if(result == null || result.rows == null) {
        throw "Stops get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Stop not found";
      }

      let destination = result.rows[0];

      let now = moment();
      const isToday = moment(date).isSame(now, "day");
      const dayOfTheWeek = moment(date).day();

      let q2;
      if(isToday) {
        q2 = "SELECT \
        ROW_NUMBER() OVER (ORDER BY departure_day, departure_hour, departure_minute) AS id, \
        segments.id as segment_id, \
        segments.price as price, \
        segments.origin_id as origin_id, \
        segments.destination_id as destination_id, \
        segments.departure_day as departure_day, \
        segments.departure_hour as departure_hour, \
        segments.departure_minute as departure_minute, \
        segments.route_id as route_id, \
        companies.id as company_id, \
        companies.name as company_name, \
        trips.days_of_the_week as days_of_the_week, \
        vehicles.rows * vehicles.columns as capacity, \
        vehicles.wifi as wifi, \
        vehicles.ac as ac \
        from routes \
        left join trips on trips.route_id = routes.id \
        left join vehicles on vehicles.id = trips.vehicle_id \
        left join segments on segments.route_id = routes.id \
        left join companies on routes.company_id = companies.id \
        where segments.origin_id = $1 \
        and segments.destination_id = $2 \
        and segments.hidden = $3 \
        and segments.departure_hour > $4 \
        and segments.departure_minute > $5 \
        and $6 = ANY (days_of_the_week::int[])"

        result = await client.query(q2, [originId, destinationId, false, now.hours(), now.minutes(), dayOfTheWeek]);
      } else {
        q2 = "SELECT \
        ROW_NUMBER() OVER (ORDER BY departure_day, departure_hour, departure_minute) AS id, \
        segments.id as segment_id, \
        segments.price as price, \
        segments.origin_id as origin_id, \
        segments.destination_id as destination_id, \
        segments.departure_day as departure_day, \
        segments.departure_hour as departure_hour, \
        segments.departure_minute as departure_minute, \
        segments.route_id as route_id, \
        companies.id as company_id, \
        companies.name as company_name, \
        trips.days_of_the_week as days_of_the_week, \
        vehicles.rows * vehicles.columns as capacity, \
        vehicles.wifi as wifi, \
        vehicles.ac as ac \
        from routes \
        left join trips on trips.route_id = routes.id \
        left join vehicles on vehicles.id = trips.vehicle_id \
        left join segments on segments.route_id = routes.id \
        left join companies on routes.company_id = companies.id \
        where segments.origin_id = $1 \
        and segments.destination_id = $2 \
        and segments.hidden = $3 \
        and $4 = ANY (days_of_the_week::int[])"

        result = await client.query(q2, [originId, destinationId, false, dayOfTheWeek]);
      }

      if(result == null || result.rows == null) {
        throw "Segments get did not return any result";
      }

      let segments = result.rows;
      let bookings;

      if(segments != null && segments.length > 0) {
        let valueArray = segments.map((x) => {return x.segment_id});
        valueArray.unshift(date);

        let paramArray = [];
        for(var i = 2; i < segments.length + 2; i++) {
          paramArray.push('$' + i);
        }

        let q3 = "SELECT segment_id, date(date), count(*) as count FROM bookings where date(date) = $1 and segment_id in (" + paramArray.join(',') + ") group by segment_id, date(date)";

        result = await client.query(q3, valueArray);

        if(result == null || result.rows == null) {
          throw "Bookings get did not return any result";
        }

        bookings = result.rows;
      }

      var t;
      for(let s of segments) {
        if(bookings != null) {
          for(let b of bookings) {
            if(b.segment_id === s.segment_id) {
              s['available_seats'] = s.capacity - b.count;
            }
          }
        }

        if(s['available_seats'] == null) {
          s['available_seats'] = s.capacity;
        }

        //fix date formatting
        t = moment(date);
        t.set({hour:s.departure_hour,minute:s.departure_minute,second:0,millisecond:0})
        s['formatted_departure'] = t.format("HH:mm");

        t = moment(date);
        t.set({hour:s.departure_hour,minute:s.departure_minute,second:0,millisecond:0})
        s['formatted_arrival'] = t.format("HH:mm");

        s['date'] = moment(date).set({hour:0,minute:0,second:0,millisecond:0}).toDate()
      }

      if(segments.length < 1) {
        let message = `Customer requested journey that doesn\'t exist:\n\
          Departure date: ${date}\n\
          From: ${origin.name}\n\
          To: " ${destination.name}`;

          result = await HttpService.post(env.bot.host + '/send_message', {message: message});
      };

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve({
          journeys: segments,
          origin_name: origin.name,
          destination_name: destination.name,
          date: moment(date).format("DD MMM"),
          previous_day: moment(date).set({hour:0,minute:0,second:0,millisecond:0}).subtract(1, "days").toISOString(),
          next_day: moment(date).set({hour:0,minute:0,second:0,millisecond:0}).add(1, "days").toISOString()
        });
      });
    } catch(e) {
      console.log(e);
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

  }
}

module.exports = SegmentService;
