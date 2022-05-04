const {MultiPathRelayClient} = require('categorical-handlers')


const PersistenceManager = require('./global_persistence')


class CategoricalPersistenceManager extends PersistenceManager {
    constructor(persistence,message_relays) {
        super(persistence,undefined)
        this.message_fowarding = (message_relays !== undefined) ? new MultiPathRelayClient(message_relays) : false
    }    
}


module.exports = CategoricalPersistenceManager;
