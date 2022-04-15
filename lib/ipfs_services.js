
const GlobalPersistence = require('./lib/global_persistence')
const IPContactServices = require('interplanetary_contact')


// cancel the timeouts...


class IPFSServices extends GlobalPersistence {

    //
    constructor(cnfg,persistence_conf,message_relays_conf) {
        super(persistence_conf,message_relays_conf)
        this.ipfs = false
        (async () => {
            this.ip_contacts = new IPContactServices(cnfg)
            this.ipfs = await this.ip_contacts.init_ipfs(cnfg)
            await this.setup_owner_as_default_receiver(cnfg)
        })()
    }
    
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    async setup_owner_as_default_receiver(conf) {
        this.receiver =  await this.get_json_from_cid(conf.service_cid)
        this.clear_cid = conf.clear_cid
    }

    async post_message(msgObject) {
        let body = {
            "message" : msgObject,
            "clear_cid" : this.clear_cid
        }
        await this.ip_contacts.send_introduction_cid(body)
        // write to IPFS contact subsystem
    }

    async get_json_from_cid(a_cid) {
        return await this.ip_contacts.get_json_from_cid(a_cid)
    }

    add_message_handler(m_handler,q_holder,prf_slow,prf_fast) {

        if ( m_handler === undefined ) return;
        let handler = m_handler
        if ( q_holder === undefined ) return;
        let _q = q_holder
        let slow = DFLT_SLOW_MESSAGE_QUERY_INTERVAL
        if ( prf_slow !== undefined ) slow = prf_slow;
        let fast = DFLT_FAST_MESSAGE_QUERY_INTERVAL
        if ( prf_slow !== undefined ) fast = prf_fast;

        let sender_index = this._all_senders.length

        let message_sender = async () => {
            let m_snder = this._all_senders[sender_index]
            if ( m_snder ) {
                if ( _q.empty_queue() ) {
                    setTimeout(() => { m_snder() }, slow )
                } else {
                    //
                    while ( !(_q.empty_queue()) ) {
                        let datum = _q.get_work()
                        let msgObject = handler(datum)
                        await this.post_message(msgObject)   // message to admin
                    }
                    setTimeout(() => { m_snder() }, fast )
                }    
            }
        }

        this._all_senders.push(message_sender)

        setTimeout(message_sender,slow)

    }

}


module.exports = IPFSServices