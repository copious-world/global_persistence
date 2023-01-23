# global_persistence

 Classes related to distributed hash tables and file checkpoints





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
	
	