const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');
const env = require('../env.js');

const HttpService = require('../services/HttpService');

const RouteService = {
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
        q2 = "SELECT * \
        from segments \
        left join routes on routes.id = segments.route_id \
        left join companies on routes.company_id = companies.id \
        left join trips on trips.route_id = routes.id \
        where segments.origin_id = $1 \
        and segments.destination_id = $2 and $3 = ANY (days_of_the_week::int[])"

        result = await client.query(q2, [originId, destinationId, dayOfTheWeek]);
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
        trips.days_of_the_week as days_of_the_week \
        from routes \
        left join trips on trips.route_id = routes.id \
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

      var t;
      for(let s of segments) {
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

module.exports = RouteService;
