var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
  
var BlockchaindbSchema   = new Schema({
    owner_name: String,
    unit_title: String,
    qual_identifier: String,
    unit_identifier: String,
    user_name: String,
    cert_hash: String
});

module.exports = mongoose.model('Blockchaindb', BlockchaindbSchema);
