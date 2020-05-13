var ENVIRONMENT = {
  production: {
    pg: {
      user: '',
      host: '',
      database: '',
      password: '',
      port: ,
      ssl: require
    },
    bot: {
      host: 'https://bot.gopamoja.com'
    }
  },
  development: {
    pg: {
      user: '',
      host: '',
      database: '',
      password: '',
      port: ,
      ssl: require
    },
    bot: {
      host: 'http://localhost:3003'
    }
  },
  staging: {
    pg: {
      user: '',
      host: '',
      database: '',
      password: '',
      port: ,
      ssl: require
    },
    bot: {
      host: 'https://test.bot.gopamoja.com'
    }
  }
};

module.exports = ENVIRONMENT[process.env.ENVIRONMENT]
