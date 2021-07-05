
const GlobalPersistence = require('./lib/global_persistence')


// cancel the timeouts...


class IPFSServices extends GlobalPersistence {
    //
    constructor(cnfg,persistence_conf,message_relays_conf) {
        super(persistence_conf,message_relays_conf)
        this.init_ipfs(cnfg)
    }

    // 
    
    //  init_ipfs
    async init_ipfs(cnfg) {
        //
        let container_dir = cnfg.ipfs.repo_location
        if ( container_dir == undefined ) {
            let repo_container = require.main.path
            container_dir =  repo_container + "/repos"
        }
        //
        let subdir = cnfg.ipfs.dir
        if ( subdir[0] != '/' ) subdir = ('/' + subdir)
        let repo_dir = container_dir + subdir
        console.log(repo_dir)
        let node = await IPFS.create({
            repo: repo_dir,
            config: {
                Addresses: {
                    Swarm: [
                    `/ip4/0.0.0.0/tcp/${cnfg.ipfs.swarm_tcp}`,
                    `/ip4/127.0.0.1/tcp/${cnfg.ipfs.swarm_ws}/ws`
                    ],
                    API: `/ip4/127.0.0.1/tcp/${cnfg.ipfs.api_port}`,
                    Gateway: `/ip4/127.0.0.1/tcp/${cnfg.ipfs.tcp_gateway}`
                }
            }
        })

        const version = await node.version()
        console.log('Version:', version.version)

        this.ipfs = node
    }


    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
    async get_complete_file_from_cid(cid) {
        let ipfs = this.ipfs
        let chunks = []
        for await ( const chunk of ipfs.cat(cid) ) {
            chunks.push(chunk)
        }
        let buff = Buffer.concat(chunks)
        let data = buff.toString()
        return data
    }
  
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
    async get_json_from_cid(a_cid) {
        let data = await this.get_complete_file_from_cid(a_cid)
        try {
            let obj = JSON.parse(data)
            return obj
        } catch (e) {
        }
        return false
    }

    async post_message(msgObject) {
        // write to IPFS contact subsystem
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