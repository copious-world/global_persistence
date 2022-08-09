const PersistenceManager = require('./lib/global_persistence')
//const InterPlanetaryContactServices = require('./lib/ipfs_services')
const CategoricalPersistenceManager = require('./lib/global_categories')
const CategoricalUserManager = require('./lib/global_category_user')
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
module.exports.CategoricalPersistenceManager = CategoricalPersistenceManager
module.exports.PersistenceManager = PersistenceManager
//module.exports.InterPlanetaryContactServices = InterPlanetaryContactServices
module.exports.CategoricalUserManager = CategoricalUserManager
