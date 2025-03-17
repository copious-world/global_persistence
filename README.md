# global_persistence

Classes related to distributed hash tables and file checkpoints

***Client side operations:*** *Clients of global categories, odb sevices, persistence endpoins, etc.*

Clients are web/application servers. Some clients might be actual web pages.


## Persistence

### Types of persistence


In the message data structure certains fields will indicate a persistence pathway. Some types have precedence over others. 

* \_paid  : \<**boolean**\>, **true** for paid access, **false** for free access after publication.
	
	> Mini link servers will provide a streaming client with meta data indicating payment being required, available to users with sessions. The meta data will also indicate the counting service which will arrange for a streamer to provide a counted stream.

* \_work\_in\_progress : either "WIP" or custom...

	> This must be a boolean **false** value in order to allow a contract to be expresed. A contract can be entered as a WIP if this is either true or a custom value.
	
	> A custom string value must be configured for paths leading to specialied servers for the store of the object being pass through.
	
* \_contract : an actual contract component (either JSON or a type of program for expressing blockchain contracts on particular blockchains.)

	> This pathway manages finalized contracts and provides automation for putting contracts into their target systems.
	

### Configuring Persistence Paths

#### conf.relayer
> The relayer configuration is a map of persistence paths to connection descriptors.
> 
> If no further configuration is given, there will be an assumption that paths being served are the paths listed. There will be an assumption that the 'persistence' path will be one of those paths.
> 
> Alternatively, a list of wrapper keys may be supplied as an object that maps into the paths provided for the relay configuration.
> 
> > \_wrapper\_keys is the field expected in the configuration that will map path names to connection. One default, a singular, \_wrapper\_key is expected. A default counter service is expected as well. The counter service will provide its link for the ucwid factory associated with the singular \_wrapper_key. The factory will have have \_x\_link\_counter attached with the configuration value provided by conf.counters.main.
>
> > In the plural form, each path key is expected to service a number of types of data. Each element of the plural \_wrapper\_keys has information  in \_wrapper\_keys[path] to allow for a number of types to obtain their own ucwid factory. The factory will be stored in `this.path_ucwids[path][a_type]`. In order to assign the counter service to the path and type, the counter configuration must supply its link: `_x_link_counter = conf.counters[path][a_type]`

The following code shows how the paths are processed. 

```

  async setup_relays() {
      let conf = this.conf
      if ( this.conf === undefined ) {
        console.warn("the conf is not defined for global categories in global persistence in setup relays")
        return
      }
      this.msg_relay = new MultiPathRelayClient(conf.relayer)
      this.path_ucwids = false
      if ( conf._wrapper_key === undefined ) {
        this.await_ready()
      } else {
        this.ucwid_factory = new UCWID({  "_wrapper_key" : conf._wrapper_key  })
        this.ucwid_factory._x_link_counter = conf.counters.main
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

```
	