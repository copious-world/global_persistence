
const {MultiPathRelayClient} = require('categorical-handlers')
//
const PersistenceManager = require('./global_persistence')
const MediaHandler = require('./media_handler')
const UCWID = require('ucwid')


// A client -- 

function lite_meta(data,finally_tracking) {
  return finally_tracking //{}
}


// figure_persistence_path
//  -- making a decision on the kinds of persistence paths that may be available to an applications
// Deciding upon: 
//  1)    persistence  -- a publicly viewable (publishable) data store object -- will be pinned within a repository
//  2)    paid-persistence  -- a publicly viewable (publishable after a contract idenitifies it) data store object -- will be pinned within a repository 
//  3)    contract  -- a privately viewable data store object, accessibly by counting services, etc. -- will be pinned within a repository
//  4)    WIP  -- a privately viewable data store object, accounted for in a blockchain recording edit operations -- will be pinned by a repository
//        note: WIP := work in progress. This is data that is stored by and retreivable by a creator 
//        for continued work until a form of publication can be determined for it
//  FIELD REQUIRED: the data metat descriptor shall contain three indicative fields: 
//  1) _paid ... true if this persists on paid pathways (especially with respect to streaming), otherwise free when not a WIP
//  2) _contract ... true if this persists on contractual pathways and the subject, a paid persistent object is mentioned in the meta descriptor
//  3) _work_in_progress ... true if this metadescriptor refers to an object that is being stored for the sake of identifying its creator
//
//  Note: a contract can be stored as a WIP until it is finalized by those in agreement (until then it will not be associated with a blockchain contract)
//
function figure_persistence_path(data) {
  //
  if ( typeof data._paid === 'boolean' ) {
    if ( data._paid ) {
      return "paid-persistence"
    }
  }
  //
  let persistence_path = "WIP"
  if ( data._work_in_progress || (typeof data._contract !== 'boolean') ) {  // "WIP"
    // _work_in_progress -- the path can be arbitrary anc carried the data packet. 
    //                   -- But, if it is not configured, the path will be ignored.
    persistence_path = ((typeof data._work_in_progress === 'string') && (data._work_in_progress !== 'true')) ? data._work_in_progress : "WIP"
  } else if ( data._contract ) { // note: _work_in_progress overrides contract
    persistence_path = "contracts"
  }
  //
  return persistence_path
}

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
//  CategoricalPersistenceManager
//
class CategoricalPersistenceManager extends PersistenceManager {

  //
  constructor(persistence,message_relays) {
      super(persistence,undefined)
      this.ready = false
      this.media_handler = false // ... the media handler has to be iniitalized
      this.message_fowarding = (message_relays !== undefined) ? new MultiPathRelayClient(message_relays) : false
  }

  //
  async initialize(conf,db) {
      this.conf = conf.repo_bridge ? conf.repo_bridge : conf
      if ( this.conf === undefined ) {
        console.warn("the repo_bridge is not defined for global categories in global persistence in initializes")
        return
      }
      if ( this.conf.media_handler ) {
        const MediaHandlerClass = require(conf.media_handler)
        this.media_handler = new MediaHandlerClass(this.conf)
      } else {
        this.media_handler = new MediaHandler(this.conf)
      }
      super.initialize(this.conf,db)
      await this.setup_relays()
  }

  /**
   * setup_relays
   * 
   * called by initialize
   * 
   * @returns promise|undefined
   */
  async setup_relays() {
      let conf = this.conf
      if ( this.conf === undefined ) {
        console.warn("the conf is not defined for global categories in global persistence in setup relays")
        return
      }
      //
      this.msg_relay = new MultiPathRelayClient(conf.relayer)
      this.path_ucwids = false
      //  default ucwid_factory
      this.ucwid_factory = new UCWID({  "_wrapper_key" : conf._wrapper_key  })
      this.ucwid_factory._x_link_counter = conf.counters.main
      //
      if ( conf._wrapper_key === undefined ) {
        this.await_ready()
      } else {
        this.path_ucwids = {    // initialize to default paths... these will be available even when they are left out of configuration
          "persistence" : {}, "paid-persistence" : {}, "contracts" : {}, "WIP" : {}
        }
        for ( let path in conf._wrapper_keys ) {  // plural
          let asset_wrapper = conf._wrapper_keys[path]
          if ( (typeof asset_wrapper !== 'string') && (typeof asset_wrapper !== 'object') ) {
            for ( let a_type in asset_wrapper ) {
              this.path_ucwids[path][a_type] = new UCWID({ "_wrapper_key" : asset_wrapper[a_type] })
              if ( conf.counters[path] ) {
                this.path_ucwids[path][a_type]._x_link_counter = conf.counters[path][a_type]
              } else {
                this.path_ucwids[path][a_type]._x_link_counter = this.ucwid_factory._x_link_counter
              }
            }  
          }
        }
        await this.await_ready()
        await this.startup()
      }
  }


  update_backup_process(the_backup) {
    console.log("an application should implement a backup process when media is being updated")
  }


  /**
   * await_ready
   * 
   * called by setup_relays
   * 
   * @returns promise|undefined
   */
  async await_ready() {
      try {
        await this.msg_relay.await_ready("persistence")  // making sure that one path is ready at least
        this.ready = true
      } catch (e) {
      }
  }

  /**
   * startup
   * 
   * called by setup_relays
   * 
   * @returns promise|undefined
   */
  async startup() {
      //
      try {
        await this.media_handler.init_repository(this.conf)
      } catch (err) {
          console.error(err)
      }
      //
  }


  supported_media_type(media_type) {
    if ( this.media_handler ) {
      return this.media_handler.supported_media_type(media_type)
    }
  }

  nearest_media_type(media_type) {
    if ( this.media_handler ) {
      return this.media_handler.nearest_media_type(media_type)
    }
    return 'text'
  }



  // -------- ---------- ----------- ------------ ------------------

  /**
   * get_ucwid_packet
   * 
   * 
   * @param {*} media 
   * @param {*} blob 
   * @param {*} no_string 
   * @returns 
   */
  async get_ucwid_packet(media,blob,no_string = false) {
    let ucwid_packet = false
    if ( this.path_ucwids == false || (this.path_ucwids[persistence_path][asset_type] === undefined)) {
      ucwid_packet = await this.ucwid_factory.ucwid(blob,no_string)
    } else {
      ucwid_packet = await this.path_ucwids[persistence_path][asset_type].ucwid(blob,no_string)
      media._x_link_counter = this.path_ucwids[persistence_path][asset_type]._x_link_counter 
    }
    if ( media._x_link_counter === undefined ) {
      media._x_link_counter = this.ucwid_factory._x_link_counter
    }
    return ucwid_packet
  }


  /**
   * store_media_field
   * 
   * @param {*} media 
   * @param {*} media_name 
   * @param {*} media_type 
   * @param {*} data 
   * @returns 
   */
  async store_media_field(media,media_name,media_type,data) {
    //
    let _tracking = false
    //
    let blob = this.media_handler.storable(media)  // get a buffer...
    //
    let no_string = true
    let ucwid_packet = await this.get_ucwid_packet(media,blob,no_string)

    // TRACKING
    _tracking = ucwid_packet.ucwid
    media._is_encrypted = this.media_handler.media_types[media_type].encrypted
    let enc_blob = media._is_encrypted ? ucwid_packet.info.cipher_buffer : blob
    if ( this.media_handler.media_types[media_type].store_repo ) {
      delete ucwid_packet.info.cipher_text
      delete ucwid_packet.info.cipher_buffer
    }

    media.ucwid_info = ucwid_packet.info
    enc_blob.name = media_name          // used by bittorent repo (maybe)
    enc_blob.ucwid = ucwid_info.ucwid   // used by bittorent repo (maybe)
    if ( !(await this.media_handler.store_media(enc_blob,media,media_name,media_type)) ) {
        console.error("did not write media")
    } else {      // copy to top level
      data.media.protocol = media.protocol
      data.media[media.protocol] = media[media.protocol]
      data.media._x_link_counter = media._x_link_counter
    }
    //
    return _tracking
  }


  /**
   * update_or_set_tracking
   * 
   * @param {*} data 
   * @param {*} tracking 
   * @param {*} update 
   */
  update_or_set_tracking(data,tracking,update) {
    if ( tracking !== false ) {      // TRACKING IS SET ONCE FOR THE LIFE OF THE OBJECT
      if ( !update ) {
        data._tracking = tracking  // provide tracking for the server or else the server has to fetch the asset, calculate tracking, and set it 
      } else if ( data._tracking === undefined ) {
        data._tracking = tracking
        data._current_rev = tracking
        data._history = []
      } else {        // don't change the tracking for DB consideration.. Do keep a history of tracking
        if ( data._history === undefined ) {
          data._history = []
        }
        data._history.push(tracking)
        data._current_rev = tracking
      }
    }
  }

  /**
   * new_entry
   * 
   * @param {object} data 
   * @param {boolean} update 
   * @returns 
   */

  async new_entry(data,update) {
    //
    let persistence_path = figure_persistence_path(data)
    //
    let the_backup = update ? {} : false
    // ... do actions on behalf of the Renderer
    //
    let asset_type = data.asset_type
    let media_type = data.media_type
    //
    //
    let _tracking = false
    // STORE MAIN MEDIA 
    if ( media_type !== 'image' ) {
      if ( data.media && data.media.source && this.media_handler ) {
        //
        _tracking = await store_media_field(data.media.source,media.name,media_type,data)
        if ( update && _tracking ) {
          the_backup.source = Object.assign({},data.media.source)
        }
        //
      }
    } else {
      if ( (typeof data.media === 'object') && (data.media.source !== undefined) ) {
        delete data.media.source  // only storing the image .. field is 'poster'
      }
    }

    // STORE POSTER
    // text can have a poster image... So can others. This method expects this field 
    // to be solitary when the type is image. As such, videos and sounds are deleted.
    if ( data.media && data.media.poster && this.media_handler ) {
      //
      _tracking = await store_media_field(data.media.poster,data.media.poster.name,'image',data)
      if ( update && _tracking ) {
        the_backup.poster = Object.assign({},data.media.poster)
      }
      //
    }

    // txt_full -- means that this media has not been handled
    if ( (_tracking === false) && (media_type === 'text') ) {   // assuming blog text will be short
      if ( update ) {
        the_backup.text = data._prev_text
        the_backup.text_ucwid_info = data.text_ucwid_info
      }
      //
      let blob = data.txt_full
      let ucwid_packet = await this.get_ucwid_packet(data,blob,false)
      //
      ucwid_packet = await this.path_ucwids[persistence_path][asset_type].ucwid(blob,no_string)
      data._x_link_counter = this.path_ucwids[persistence_path][asset_type]._x_link_counter 
      //
      _tracking = ucwid_packet.ucwid      // handle tracking > next block
      data.text_ucwid_info = ucwid_packet.info
    }

    if ( update && (the_backup !== false) ) {
      this.update_backup_process(the_backup)
    }

    this.update_or_set_tracking(data,_tracking,update)

    let id = data._id;          // user tracking number
    let finally_tracking = false
    // IF ADMIN GO AHEAD AN STORE IN PUBLICATION DIRECTORY
    // OTHERWISE SEND IT TO THE ENDPOINT AND STORE IT IN THE USER DIRECTORY
    //
    if ( id === 'admin' ) {
        try {
            let dir = this.entries_dir
            dir = dir.replace("$asset_type",asset_type)
            let out_file = dir + _tracking + '+' + id + ".json"
            //
            fs.writeFileSync(out_file,JSON.stringify(data,false,2))
        } catch (e) {
            console.error("did not write image")
        }  
    } else {
      if ( update ) {
          let resp = await this.msg_relay.update_on_path(data,persistence_path)
          if ( resp.status === "OK" ) {
              finally_tracking = resp._tracking
          }
      } else {
          let asset_path = `${_tracking}+${asset_type}+${id}`   // the tracking just got made, so the asset_path is new (used by storage)
          data.asset_path = asset_path
          let resp = await this.msg_relay.create_on_path(data,persistence_path)
          if ( resp.status === "OK" ) {
              //add_to_manifest(resp.data)
              console.log("stored")
              finally_tracking =  resp._tracking
          }    
      }
    }

    return lite_meta(data,finally_tracking)
  }


  //
  store_encrypted(file_data) {
      return file_data
  }


  // // // // // // // // // //

  async get_entry(data) {
    if ( (this.msg_relay === false) || !(this.ready) ) return
    // ... do actions on behalf of the Renderer
    if ( data && data._id ) {
      let persistence_path = figure_persistence_path(data)
      let resp = await this.msg_relay.get_on_path(data,persistence_path)
      if ( resp.status === "OK" ) {
          let output = JSON.parse(resp.data)
          if ( output.mime_type.indexOf("/json") > 0 ) {
              output = JSON.parse(output.string)
          }
          return output
      }
    }
  }


  // // // // // // // // // //

  async delete_entry(data) {
    if ( (this.msg_relay === false) || !(this.ready) ) return
    // ... do actions on behalf of the Renderer
    if ( data && data._id ) {
      let persistence_path = figure_persistence_path(data)
      let resp = await this.msg_relay.del_on_path(data,persistence_path)
      if ( resp.status === "OK" ) {
          console.log("deleted")
      }
    }
  }



  // // // // // // // // // //

  async publish_entry(data) {
    //
    if ( (this.msg_relay === false) || !(this.ready) ) return
    // ... do actions on behalf of the Renderer
    if ( data && data._id ) {
      let persistence_path = figure_persistence_path(data)
      let resp = await this.msg_relay.publication_on_path(data,persistence_path)
      if ( resp.status === "OK" ) {
          //add_to_manifest(resp.data)
          console.log("published")
          return resp._tracking
      }
      //
    }
    //
  }

  // // // // // // // // // //

  async unpublish_entry(data) {
    //
    if ( (this.msg_relay === false) || !(this.ready) ) return
    // ... do actions on behalf of the Renderer
    if ( data && data._id ) {
      let persistence_path = figure_persistence_path(data)
      let resp = await this.msg_relay.unpublish_on_path(data,persistence_path)
      if ( resp.status === "OK" ) {
          //add_to_manifest(resp.data)
          console.log("unpublish")
          return resp._tracking
      }
      //
    }
  }
  


  // // // // // // // // // //

  async set(key,value) {  // value should be a JSON object that can be transformed into a meta representation and a file element
    let meta_info = await this.new_entry(value,false)
    await super.set(key,meta_info)
  }

  // // // // // // // // // //

  async update_entry(data) {
    let meta_info = await this.new_entry(data,true)
    super.set(key,meta_info)
    return true
  }

  async get(key) {    // token must have been returned by set () -> augmented_hash_token
    let meta =  super.get(key)
    return await this.get_entry(meta)
  }


  async delete(key) {
    let meta_info = this.delete(key)
    return this.delete_entry(meta_info)
  }

  // ----
  hash_set(key,value) {  // value should be a JSON object that can be transformed into a meta representation and a file element
    return super.hash_set(key,value)
  }

}


module.exports = CategoricalPersistenceManager;
