var express = require('express');
var router = express.Router();

var db = require('../queries-api-v2');
var apiVer = '/api/v2'

router.delete('/totaldelete/key/:key', db.totalRemove);
router.delete('/deletesembol/', db.removeSymbol);
router.get('/info', db.getFullInfo);
router.post(apiVer + '/symbol', db.createSymbol);
router.get(apiVer + '/symbol', db.getSymbol);


// CATEGORY
router.get(apiVer    +'/category/scale/:scale/lang/:lang', db.getAllCategory);
router.get(apiVer    +'/category/:id/scale/:scale/lang/:lang', db.getSingleCategory);
router.post(apiVer   +'/category/key/:key', db.createCategory);
router.put(apiVer    +'/category/:id/key/:key', db.updateCategory);
router.delete(apiVer +'/category/:id', db.deleteCategoryFull);
router.delete(apiVer +'/category/:id/safe', db.deleteCategory);

// IMAGE FROM CATEGORY
router.get(apiVer    +'/category/:category_id/pose/scale/:scale/lang/:lang', db.getAllImageFromCategory);
router.get(apiVer    +'/category/:category_id/pose/:pose_id/scale/:scale/lang/:lang', db.getSingleImageFromCategory);
router.post(apiVer   +'/category/:category_id/pose/key/:key', db.createImageInCategory);
router.put(apiVer    +'/category/:category_id/pose/:pose_id/key/:key', db.updateImageFromCategory);
router.delete(apiVer +'/category/:category_id/pose/:pose_id/key/:key', db.deleteImageFromCategoryFull);
router.delete(apiVer +'/category/:category_id/pose/:pose_id/key/:key/safe', db.deleteImageFromCategory);

module.exports = router;
