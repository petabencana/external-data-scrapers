// Verify expected arguments and get config
if (process.argv[2]) {
    var config = require( __dirname + path.sep + process.argv[2] );
  } else {
      throw new Error('No config file. Usage: node index.js config.js');
  }