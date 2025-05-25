
// openssl ecparam -name secp384r1 -genkey -noout -out server.ec.key
// openssl pkcs8 -topk8 -in server.ec.key -out server.pem
// myecpassword1234
// openssl ec -in server.pem -pubout -out server-public.pem

// MultiPathRelayClient will make a connection for each configured path 
// in this case 2: 1) one for user; 2) the other for the meta data store, persistence.
const GlobalCategories = require('./global_categories')
const UCWID = require('ucwid')



class CategoryUser extends GlobalCategories {

    // // // // // // // // // //
    constructor(persistence,message_relays) {
      super(persistence,message_relays)

      this.fetcher = false
      let user_fetcher_conf = this.conf.user_fetcher_conf
      if ( typeof user_fetcher_conf === 'string' ) {
        this.fetcher = require(user_fetcher_conf)
      }

    }

    // // // // // // // // // //

    // wait_for_key -- the user does not necessarily have to be a special case.
    // but we are asking for a counting service that can be associated with a user id
    // this has to do with the user having chosen the service as a means of transaction
    // or it has to do with the user being identifiable by some counting service.
    //
    //  actually, the user id maps to the permission allowing the user of the counting service...
    async wait_for_key(user_id) {
        let message = {
          "_id" : user_id
        }
        this.conf._wrapper_keys = {}
        for ( let path of [ "persistence", "paid-persistence", "contract", "WIP" ]) {
          this.conf._wrapper_keys[path] = {}
          this.path_ucwids[path] = {}
          let result = await this.msg_relay.send_op_on_path(message, path,"KP")  // list the counters known to the persistence server
          //
          // this permission should be in the LRU for the session....
          //
          if ( result && result.status === "OK" ) {
            let counter_links = result.counting_links
            let endpoint = `creative-gets-public-key/${user_id}`   /// a query to the counting service...
            for ( let clink in counter_links ) { // clink is likely an asset type
              let counter_link = counter_links[clink]
              // transform this from a web client call to a server based call
              if ( this.fetcher ) {
                let key_query_result = await this.fetcher.fetchEndPoint(endpoint,counter_link)  // /creative-gets-public-key/:creative
                if ( key_query_result.status === "OK" ) {
                  this.conf._wrapper_keys[path][clink] = key_query_result.public_wrapper_key
                  this.path_ucwids[path][clink] = new UCWID({ "_wrapper_key" : key_query_result.public_wrapper_key })
                  this.path_ucwids[path][clink]._x_link_counter = counter_link
                }  
              }
            }
          }  
        }
        //
    }


    // // // // // // // // // //

    /**
     * user_ready
     * 
     * The single parameter `data` should be a meta descriptor of data. 
     * The owner of the data must have its ID in the `_id` field.
     * `data._id`
     * 
     * This method is optional in the back end. If the backend has a way to manage identity 
     * given the asset, then this operation is not required in order to call the methods made available
     * by GlobalCategories.
     * 
     * @param {object} data 
     * @returns 
     */
    async user_ready(data) {
        if ( this.msg_relay === false ) return
        if ( data && data._id ) {
            let u_data = await this.msg_relay.get_on_path(data,'user')
            // { "status" : stat, "data" : data,  "explain" : "get", "when" : Date.now() }
            if ( u_data && u_data.status !== "ERR" ) {
                let u_obj = JSON.parse(u_data.data)
                /*
                this._user_data = Object.assign({},u_obj) 
                this.msg_relay.subscribe(`user-dashboard-${this._user_data._id}`,'persistence',u_obj)
                this.msg_relay.subscribe(`user-dashboard-${this._user_data._id}`,'paid-persistence',u_obj)
                await this.wait_for_key(this._user_data._id)
                */
                return u_obj._tracking
            } else {
                let resp = await this.msg_relay.create_on_path(data,'user')
                if ( resp.status === "OK" ) {
                    data._tracking = resp._tracking
                    u_data = await this.msg_relay.get_on_path(data,'user')
                    // { "status" : stat, "data" : data,  "explain" : "get", "when" : Date.now() }
                    if ( u_data && u_data.status !== "ERR" ) {
                        let u_obj = JSON.parse(u_data.data)
                        /*
                        this._user_data = Object.assign({},u_obj) 
                        this.msg_relay.subscribe(`user-dashboard-${this._user_data._id}`,'persistence',u_obj)
                        this.msg_relay.subscribe(`user-dashboard-${this._user_data._id}`,'paid-persistence',u_obj)
                        await this.wait_for_key(this._user_data._id)
                        */
                        return u_obj._tracking
                    }
                }
            }
        }
        return false
    }

}


module.exports = CategoryUser