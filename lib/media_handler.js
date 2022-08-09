const Repository = require('repository-bridge')


//
let DEFAULT_P2P_REPO = 'ipfs'



var g_media_types = {
    "audio" : { "encrypted" : true, "store_local" : true, "store_repo" : true },
    "video" : { "encrypted" : false, "store_local" : true, "store_repo" : true },
    "image" : { "encrypted" : true, "store_local" : true, "store_repo" : true },
    "text" : { "encrypted" : true, "store_local" : true, "store_repo" : false }
}


 
  // decryption in back directory....

class MediaHandler {
  //
  constructor(conf) {
    //
    this.media_dir = conf.media_dir
    this.entries_dir = conf.entries_dir
    //
    this.media_types = conf && conf.media_types ? conf.media_types : g_media_types 
    this.repository = false
    if ( this.media_dir ) {
      for ( let mt in this.media_types ) {
        this.media_types[mt].dir =  this.media_dir.replace('$media_type',mt)
      }  
    }    //
  }

  async init_repository(conf) {
    DEFAULT_P2P_REPO = conf.default_p2p_repo
    this.repository = new Repository(conf,[DEFAULT_P2P_REPO])
    await this.repository.init_repos()
  }

  // _media_storage
  // FOR IMAGE AND STREAM
  //      media_name is for local disk storage only...
  //    What goes to the ipfs like repository is the encode blob of data. The same as the local file...
  //

  async _media_storage(repo_kind,media_name,media_type,enc_blob) {
      //
      try {
        let media_dir = this.media_types[media_type].dir
        let out_file = media_dir + media_name
        // store to the local drive
        let store_local = this.media_types[media_type].store_local
        if ( store_local ) {
          fs.writeFileSync(out_file,enc_blob)
        }
        // store to the local drive
        let store_repo = this.media_types[media_type].store_repo
        if ( store_repo && this.repository ) {
          // add locally to the p2p subsytem... -> this will be pinned in the persistence manager...
          const repo_id = await this.repository.add(repo_kind,enc_blob)
          if ( repo_id !== false ) {
            return {
              "protocol" : repo_kind,
              "id" : repo_id
            }  
          }
        }
        return true
      } catch (e) {
        return false
      }
      //
  }

  storable(source) {      // turn data into something that can be processed further down the line
    let blob_data = source.blob_url
    delete source.blob_url  // this is only used to go from the interface to storage 
    //
    let bdata_parts = blob_data.split(',')
    let blob_bytes = bdata_parts[1]
    let blob = Buffer.from(blob_bytes, 'base64');
    return blob
  }

  // store_media
  //      ---- store the actual data... and edit the fields of the meta data object
  //      ---- this is the api interface for storing across the repository bridge from here.
  async store_media(blob,media,media_name,media_type) {
    // 
    if ( media_type in this.media_types ) {
      let result = await this._media_storage(DEFAULT_P2P_REPO,media_name,media_type,blob)
      if ( typeof result === 'boolean' ) {
        return result
      } else {
        media.protocol = result.protocol
        media[media.protocol] = result.id
      }
      return true
    }
    return false
  }

}



module.exports = MediaHandler

