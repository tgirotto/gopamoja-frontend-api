var ENVIRONMENT = {
  production: {
    pg: {
      user: 'gopamoja-app',
      host: 'gopamoja-db-1-do-user-6613101-0.db.ondigitalocean.com',
      database: 'gopamoja-production',
      password: 'muyuaq0b3zjekgqg',
      port: 25061,
      ssl: require
    },
    bot: {
      host: 'https://bot.gopamoja.com'
    }
  },
  development: {
    pg: {
      user: 'gopamoja-app',
      host: 'gopamoja-db-1-do-user-6613101-0.db.ondigitalocean.com',
      database: 'gopamoja-dev',
      password: 'muyuaq0b3zjekgqg',
      port: 25061,
      ssl: require
    },
    bot: {
      host: 'http://localhost:3003'
    }
  },
  staging: {
    pg: {
      user: 'gopamoja-app',
      host: 'gopamoja-db-1-do-user-6613101-0.db.ondigitalocean.com',
      database: 'gopamoja-staging',
      password: 'muyuaq0b3zjekgqg',
      port: 25061,
      ssl: require
    },
    bot: {
      host: 'https://test.bot.gopamoja.com'
    }
  }
};

module.exports = ENVIRONMENT[process.env.ENVIRONMENT || 'development']
