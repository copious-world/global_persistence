const PersistenceManager = require('./lib/global_persistence')
const CategoricalPersistenceManager = require('./lib/global_categories')
const CategoricalUserManager = require('./lib/global_category_user')
const {nearest_media_type} = require('./lib/media_handler')
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
module.exports.CategoricalPersistenceManager = CategoricalPersistenceManager
module.exports.PersistenceManager = PersistenceManager
module.exports.CategoricalUserManager = CategoricalUserManager
module.exports.nearest_media_type = nearest_media_type
