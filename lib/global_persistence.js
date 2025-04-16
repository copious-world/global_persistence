

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


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

class PersistenceManager   {
  //
  constructor(conf,lru_conf,message_relays) {
    this.conf = conf
    this.session_cache = false

    if ( (conf.cache_manager !== undefined) && (conf.cache_manager !== false) ) {
      this.session_cache  = new conf.cache_manager(lru_conf,message_relays)
    } else if ( typeof lru_conf === 'object' ) {
      if ( lru_conf.use_deprecated ) {
        const {SessionCacheManager} = require('global_session')
        this.session_cache = new SessionCacheManager(lru_conf,message_relays)
      }
    }
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
    if ( this.session_cache ) {
      return this.session_cache.get(key)
    }
    return false
  }


  set(key,value) {
    if ( this.session_cache ) {
      this.session_cache.set(key,value)
    }
  }

  // ----
  hash_set(key,value) {
    if ( this.session_cache ) {
      return this.session_cache.hash_set(key,value)
    }
  }


}


module.exports = PersistenceManager;
