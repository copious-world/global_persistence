function fix_path(a_path) {
    if ( a_path[a_path-1] === '/' ) return a_path.substr(0,a_path.length-1)
    else return a_path
}

  

module.exports.fix_path = fix_path