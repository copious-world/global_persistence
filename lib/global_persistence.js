const {SessionCacheManager} = require('global_session')

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

// This is a client

class PersistenceManager extends SessionCacheManager  {
  //
  constructor(lru_conf,message_relays) {
    //
    super(lru_conf,message_relays)
    //
    /*
    if ( persistence.password ) {
      this.persistence_pass = persistence.password.trim(); // decrypt ??  // remote password for admin authority... not on this box
    }
    */
    this._all_senders = []
  }

  initialize(conf,db) {}

  mark_session_sent(proc_id,key) {}

  session_sent(proc_id,key) {
    return false
  }


  application_set_key_notify(key,handler) {
    super.application_set_key_notify(key,handler)
  }

  application_notify_value(key) {
    super.application_notify_value(key)
  }

  // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----



  async get(key) {    // token must have been returned by set () -> augmented_hash_token
    return super.get(key)
  }


  set(key,value) {
    super.set(key,value)
  }

  // ----
  hash_set(key,value) {
    return super.hash_set(key,value)
  }


}


module.exports = PersistenceManager;
