const {SessionCacheManager} = require('global-session')

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

const DFLT_SLOW_MESSAGE_QUERY_INTERVAL = 5000
const DFLT_FAST_MESSAGE_QUERY_INTERVAL = 1000


/*
{
  "lastAccess": 1343846924959,
  "cookie": {
    "originalMaxAge": 172800000,
    "expires": "2012-08-03T18:48:45.144Z",
    "httpOnly": true,
    "path": "/"
  },
  "user": { 
    "name":"waylon",
    "status":"pro"
  }
}
*/


class PersistenceManager extends SessionCacheManager  {
//
  constructor(lru_conf,message_relays) {
    super(lru_conf,message_relays)
    if ( persistence.password ) {
      this.persistence_pass = persistence.password.trim(); // decrypt ??  // remote password for admin authority... not on this box
    }
    this._all_senders = []
  }


}


module.exports = PersistenceManager;
