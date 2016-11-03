var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/kamasutra_db');

var db = mongoose.connection;
var Schema = mongoose.Schema;

var SymbolSchema = new Schema({
    symbol_image: { type: Schema.Types.Mixed, required: true },
    symbol_svg: { type: Schema.Types.Mixed, required: true },
    symbol_name_id: { type: String }
});

var PoseSchema = new Schema({
    pose_title: { type: Schema.Types.Mixed, required: true },
    rating: { type: Number, min:0, max:5, required: true },
    desc_short: { type: Schema.Types.Mixed, required: true },
    desc_full: { type: Schema.Types.Mixed, required: true },
    pose_image_preview: { type: Schema.Types.Mixed, required: true },
    pose_image_original: { type: Schema.Types.Mixed, required: true },
    isDeleted: {type: Boolean, required: true, default: 'false'},
    update_time: {type: String},
    pose_name_id: {type: String}
});

var CategorySchema = new Schema({
    category_title: { type: Schema.Types.Mixed, required: true },
    category_image: {type: Schema.Types.Mixed, required: true},
    symbol_url: { type: Schema.Types.Mixed, required: true },
    isDeleted: {type: Boolean, required: true, default: 'false'},
    category_name_id: {type: String},
    update_time: {type: String},
    image_pose: [PoseSchema]
});

var CategoryModel = mongoose.model('CategorySchema', CategorySchema);
var PoseModel = mongoose.model('PoseSchema', PoseSchema);
var SymbolModel = mongoose.model('SymbolSchema', SymbolSchema);

module.exports = {
    CategoryModel: CategoryModel,
    PoseModel: PoseModel,
    SymbolModel: SymbolModel
}
