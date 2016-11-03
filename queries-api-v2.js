var model = require('./models/mongoose');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs-extra');
var sizeOf = require('image-size');

var KEY = "34ufk3uhig3948fh3bfj3brivub3i4biv3u4bg2";
var HOST = "https://baevra.com/";

/// Service functions
// public
function totalRemove(req, res, next) {
    if (req.params.key != KEY) return res.json({ message: "Permission denied"});

    model.CategoryModel.remove({}, function(err) {
        if (err) return next(err);
        fs.removeSync('uploads/category/');
        res.send("the destruction was successful");
    });
}
function removeSymbol(req, res, next) {
    //if (req.params.key != KEY) return res.json({ message: "Permission denied"});
    model.SymbolModel.remove({}, function(err) {
        if (err) return next(err);
        fs.removeSync('uploads/symbol/');
        res.send("the destruction symbol was successful");
    });
}
function getFullInfo(req, res, next) {
    model.CategoryModel.find({}, function(err, category) {
        var dataArray = [];
        category.forEach(function(category_elem) {
            var poseDataArray = [];
            if (category_elem.image_pose.length > 0) {
                category_elem.image_pose.forEach(function(pose_elem) {
                    poseDataArray.push({
                        id: pose_elem._id,
                        title: pose_elem.pose_title,
                        original_image : pose_elem.pose_image_original,
                        preview_image : pose_elem.pose_image_preview,
                        desc_short : pose_elem.desc_short,
                        desc_full : pose_elem.desc_full,
                        update_time : pose_elem.update_time,
                        rating : pose_elem.rating,
                        isDeleted : pose_elem.isDeleted
                    });
                });
            }
            dataArray.push({
                id : category_elem._id,
                title : category_elem.category_title,
                symbol : category_elem.symbol_url,
                image : category_elem.category_image,
                update_time : category_elem.update_time,
                isDeleted : category_elem.isDeleted,
                pose : poseDataArray
            });
        });
        res.json(dataArray);
    });
}
// private
function makeId() {
    var text='';
    var possible = '0123456789zxcvbnmasdfghjklqwertyuiop';
    for (var i = 0; i < 22; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
///

// API V2 CATEGORY - MongoDB
// GET: /api/v2/category/scale/:scale/lang/:lang
function getAllCategory(req, res, next) {
    model.CategoryModel.find({ isDeleted : false }, function(err, category) {
        if (err) return next(err);
        var newObjCategory  = [];
        category.forEach(function(category_elem) {
             //elem.image_pose = [];

                var categoryImage = '';
                var symbolImage = '';
                 switch (req.params.scale) {
                     case 'small':
                         categoryImage = category_elem.category_image[0];
                         symbolImage = category_elem.symbol_url[0];
                         break;
                     case 'medium':
                         categoryImage = category_elem.category_image[1];
                         symbolImage = category_elem.symbol_url[1];
                         break;
                     case 'high':
                         categoryImage = category_elem.category_image[2];
                         symbolImage = category_elem.symbol_url[2];
                         break;
                     default:
                 }

                //var full_catefory_image_path = path.join(__dirname, categoryImage.url);
                //var full_symbol_image_path = path.join(__dirname, symbolImage.url);

                var categoryTitle = category_elem.category_title[req.params.lang];

                if (categoryTitle) {
                    newObjCategory.push({
                        id : category_elem._id,
                        title : categoryTitle,
                        symbol : { url : symbolImage.url },
                        image : { url : categoryImage.url,
                            width : categoryImage.width,
                            height : categoryImage.height
                        },
                        update_time : category_elem.update_time,
                        isDeleted : category_elem.isDeleted
                    });
                }
        });
        res.json(newObjCategory);
    });
}
// GET: /api/v2/category/:id/scale/:scale/lang/:lang
function getSingleCategory(req, res, next) {
    model.CategoryModel.findById(req.params.id, function(err, category) {
        if (err) return res.send( err.message );

        if ( category.isDeleted == false ) {
            var categoryImage ='';
            var symbolImage ='';

            switch (req.params.scale) {
                case 'small':
                    categoryImage = category.category_image[0];
                    symbolImage = category.symbol_url[0];
                    break;
                case 'medium':
                    categoryImage = category.category_image[1];
                    symbolImage = category.symbol_url[1];
                    break;
                case 'high':
                    categoryImage = category.category_image[2];
                    symbolImage = category.symbol_url[2];
                    break;
                default:
            }

            //var full_image_path = path.join(__dirname, categoryImage.url);
            //var full_symbol_image_path = path.join(__dirname, symbolImage.url);

            var categoryTitle = category.category_title[req.params.lang];

            res.json({  id : category._id,
                     title : categoryTitle,
                     image : { url : categoryImage.url,
                             width : categoryImage.width,
                            height : categoryImage.height
                     },
                     symbol : { url : symbolImage.url }
            });

        } else {
            res.json({});
        }

    });
}
// POST: /api/v2/category
function createCategory(req, res, next) {
    if (req.params.key != KEY) return res.json({ message: "Permission denied"});

    var category_name_id = makeId();
    var categoryPath = 'uploads/category/'+category_name_id;

    fs.mkdirsSync(categoryPath);

    var form = formidable.IncomingForm();
    form.uploadDir = categoryPath;
    form.keepExtensions = true;
    form.multiples = true;
    form.type = 'multipart/form-data';

    form.parse(req, function(err, fields, files) {
        if (err) return res.json({ message: err.message });

        function sortAndScale(array) {
            array.sort(function(a,b) {return a.width - b.width});
            array[0]["scale"] = "small";
            array[1]["scale"] = "medium";
            array[2]["scale"] = "high";
        }
        sortAndScale(categoryImages);
        //sortAndScale(symbolImages);

        var language = {
            "ru":"",
            "en":""
        };

        if ( (fields.language == "ru") || (fields.language == "en") ) {
            language[fields.language] = fields.title;

            model.SymbolModel.findById(fields.symbol, function(err, symbol) {

                var category = new model.CategoryModel({
                    category_title: language,
                    category_image: categoryImages,
                    symbol_url: symbol.symbol_image,
                    category_name_id: category_name_id,
                    update_time: Date.now(),
                    image_pose: []
                });

                category.save(function(err) {
                    if (err) return next(err);
                    res.json({ message: "Категория успешно добавлена", cat: category });
                });

            });

        } else {
            res.json({message: "Такой язык не поддерживается!"});
        }
    });

    var categoryImages = [];
    //var symbolImages = []

    function addObjectInArray(array, file) {
        var dimensions = sizeOf(file.path);
        array.push({ url: file.path.slice(7),
            width: dimensions.width,
            height: dimensions.height
        });
    }

    form.on('file', function(name, file) {
        if (name == 'category') {
            addObjectInArray(categoryImages, file);
        }
        //if (name == 'symbol') {
        //    addObjectInArray(symbolImages, file);
        //}
    });
}
// PUT: /api/v2/category/:id
function updateCategory(req, res, next) {
    if (req.params.key != KEY) return res.json({ message: "Permission denied"});

    model.CategoryModel.findById(req.params.id, function(err, category) {

        var categoryPath = 'uploads/category/'+category.category_name_id+'/';

        var form = formidable.IncomingForm();
        form.uploadDir = categoryPath;
        form.keepExtensions = true;
        form.multiples = true;
        form.type = 'multipart/form-data';

        form.parse(req, function(err, fields, files) {
            if (err) return res.json({ message: err.message });

            if (ratio.length > 1) {
                ratio.sort(function(a,b) {return a.width - b.width});
                ratio[0].scale = "small";
                ratio[1].scale = "medium";
                ratio[2].scale = "high";

                category.category_image = ratio;
                category.markModified('category_image');
            }

            if (fields.symbol_url) {
                category.symbol_url = fields.symbol_url;
                category.markModified('symbol_url');
            }
            if (fields.isDeleted) {
                category.isDeleted = fields.isDeleted;
                category.markModified('isDeleted');

                category.image_pose.forEach(function(item) {
                  item.isDeleted = fields.isDeleted;
                });
                category.markModified('image_pose');
            }

            category.update_time = Date.now();
            category.markModified('update_time');

            if (fields.language == "ru" || fields.language == "en") {
                if (fields.title) {
                    category.category_title[fields.language] = fields.title;
                    category.markModified('category_title');
                }
            } else {
                return res.json({ message :"Такой язык не поддерживается!" });
            }

            category.save(function(err) {
                if (err) return next(err);
                res.json({ message: "Категория успешно обновлена", cat: category });
            });
        });

        var ratio = [];

        form.on('file', function(name, file) {
            var dimensions = sizeOf(file.path);
            ratio.push({ url: file.path.slice(7),
                width: dimensions.width,
                height: dimensions.height
            });
        });
    });
}
// DELETE /api/v2/category/:id
function deleteCategoryFull(req, res, next) {
    if (req.params.key != KEY) return res.json({ message: "Permission denied"});

    model.CategoryModel.findById(req.params.id, function(err, category) {
        if (err) return next(err);
        fs.removeSync('uploads/category/'+category.category_name_id);

    });
    model.CategoryModel.findByIdAndRemove(req.params.id, function(err) {
        if (err) return next(err);
        res.json({message: "Категория успешно удалена полностью"});
    });
}
// DELETE /api/v2/category/:id/safe
function deleteCategory(req, res, next) {
    if (req.params.key != KEY) return res.json({ message: "Permission denied"});

    model.CategoryModel.findByIdAndUpdate(req.params.id, { isDeleted: true }, function(err, category) {
        if (err) return next(err);
        category.image_pose.forEach(function(item) {
          item.isDeleted = true;
        });
        category.markModified('image_pose');
        category.save(function(err, updatedItem) {
          if (err) {
            return res.status(400).json({ message: err.message });
          } else {
            return res.json({ message: "Категория успешно удалена" });
          }
        });
    });
}

// API V2 IMAGE FROM CATEGORY - MongoDB
// GET: /api/v2/category/:category_id/pose
function getAllImageFromCategory(req, res, next) {
    model.CategoryModel.findById(req.params.category_id, function(err, category) {
        if (err) {
            return res.json({ message: err.message });
        }
        var pose = [];
        category.image_pose.forEach(function(elem) {
            if (elem.isDeleted == false) {

                switch (req.params.scale) {
                    case 'small':
                        var preview = elem.pose_image_preview[0];
                        break;
                    case 'medium':
                        var preview = elem.pose_image_preview[1];
                        break;
                    case 'high':
                        var preview = elem.pose_image_preview[2];
                        break;
                    default:
                }

                //var full_image_path = path.join(__dirname, preview.url);
                var poseTitle = elem.pose_title[req.params.lang];
                var poseDescShort = elem.desc_short[req.params.lang];

                if (poseTitle || poseDescShort) {
                    pose.push({
                        id : elem._id,
                        title : poseTitle,
                        preview_image: { url : preview.url,
                            width : preview.width,
                            height : preview.height
                        },
                        desc_short : poseDescShort,
                        rating : elem.rating,
                        update_time : elem.update_time,
                        isDeleted : elem.isDeleted
                    });
                }
            }
        });
        res.json(pose);
    });
}
// GET: /api/v1/category/:category_id/pose/:pose_id
function getSingleImageFromCategory(req, res, next) {
    model.CategoryModel.findById(req.params.category_id, function(err, category) {
        if (err) { return res.json({ message: err.message }); }

        var pose = category.image_pose.id(req.params.pose_id);

        if (pose.isDeleted == false) {

            switch (req.params.scale) {
                case 'small':
                    var original = pose.pose_image_original[0];
                    break;
                case 'medium':
                    var original = pose.pose_image_original[1];
                    break;
                case 'high':
                    var original = pose.pose_image_original[2];
                    break;
                default:
            }

            //var full_image_path = path.join(__dirname, original.url);

            var poseTitle = pose.pose_title[req.params.lang];
            var poseDescShort = pose.desc_short[req.params.lang];
            var poseDescFull = pose.desc_full[req.params.lang];

            res.json({
                id: pose._id,
                title: poseTitle,
                original_image: { url : original.url,
                    width: original.width,
                    height: original.height
                },
                desc_short: poseDescShort,
                desc_full: poseDescFull,
                rating: pose.rating,
                update_time : pose.update_time,
                isDeleted : pose.isDeleted
            });

        } else {
            res.json({});
        }
    });
}
// POST: /api/v1/category/:category_id/pose/
function createImageInCategory(req, res, next) {
    if (req.params.key != KEY) return res.json({ message: "Permission denied"});

    model.CategoryModel.findById(req.params.category_id, function(err, category) {

        var pose_name_id = makeId();
        var categoryPath = 'uploads/category/' + category.category_name_id + '/pose/' + pose_name_id;

        fs.mkdirsSync(categoryPath);

        var form = formidable.IncomingForm();
        form.uploadDir = categoryPath;
        form.keepExtensions = true;
        form.multiples = true;
        form.type = 'multipart/form-data';

        form.parse(req, function(err, fields, files) {
            if (err) return res.json({ message: err.message });

            function sortAndScale(array) {
                array.sort(function(a,b) {return a.width - b.width});
                array[0]["scale"] = "small";
                array[1]["scale"] = "medium";
                array[2]["scale"] = "high";
            }
            sortAndScale(preview);
            sortAndScale(original);

            var titleTranslateDict = {
                "ru":"",
                "en":""
            };
            var descShortTranslateDict = {
                "ru":"",
                "en":""
            };
            var descFullTranslateDict = {
                "ru":"",
                "en":""
            };

            if (fields.language == "ru" || fields.language == "en") {
                titleTranslateDict[fields.language] = fields.title;
                descShortTranslateDict[fields.language] = fields.desc_short;
                descFullTranslateDict[fields.language] = fields.desc_full;
            } else {
                return res.json({ message: "Такой язык не поддерживается!" });
            }

            var pose = new model.PoseModel({
                pose_title: titleTranslateDict,
                rating: fields.rating,
                desc_short: descShortTranslateDict,
                desc_full: descFullTranslateDict,
                pose_image_preview: preview,
                pose_image_original: original,
                pose_name_id: pose_name_id,
                update_time: Date.now()
            });

            pose.save(function(err) { if (err) return next(err); });

            category.image_pose.push(pose);

            category.save(function(err) {
                if (err) return next(err);
                res.json({message: "Поза успешно добавлена", pose: pose});
            });

        });

        var preview = [];
        var original = [];

        function addObjectInArray(array, file) {
            var dimensions = sizeOf(file.path);
            array.push({ url: file.path.slice(7),
                width: dimensions.width,
                height: dimensions.height
            });
        }

        form.on('file', function(name, file) {
            if (name == 'preview') {
                addObjectInArray(preview, file);
            }
            if (name == 'original') {
                addObjectInArray(original, file);
            }
        });
    });
}
// PUT: /api/v1/category/:category_id/pose/:pose_id
function updateImageFromCategory(req, res, next) {
    if (req.params.key != KEY) return res.json({ message: "Permission denied"});

    model.CategoryModel.findById(req.params.category_id, function(err, category) {
        var pose = category.image_pose.id(req.params.pose_id);

        var posePath = 'uploads/category/'+category.category_name_id+'/pose/';

        var form = formidable.IncomingForm();
        form.uploadDir = posePath;
        form.keepExtensions = true;
        form.multiples = true;
        form.type = 'multipart/form-data';

        form.parse(req, function(err, fields, files) {
            if (err) return res.json({ message: err.message });

            if ( preview.length > 1  ) {
                preview.sort(function(a,b) {return a.width - b.width});
                preview[0].scale = "small";
                preview[1].scale = "medium";
                preview[2].scale = "high";

                pose.pose_image_preview = preview;
                pose.markModified('pose_image_preview');
            }

            if ( original.length > 1  ) {
                original.sort(function(a,b) {return a.width - b.width});
                original[0].scale = "small";
                original[1].scale = "medium";
                original[2].scale = "high";

                pose.pose_image_original = original;
                pose.markModified('pose_image_original');
            }

            if (fields.language == "ru" || fields.language == "en") {
                if (fields.title) {
                    pose.pose_title[fields.language] = fields.title;
                    pose.markModified('pose_title');
                }
                if (fields.desc_short) {
                    pose.desc_short[fields.language] = fields.desc_short;
                    pose.markModified('desc_short');
                }
                if (fields.desc_full) {
                    pose.desc_full[fields.language] = fields.desc_full;
                    pose.markModified('desc_full');
                }
            } else {
                return res.json({ message: "Такой язык не поддерживается!" });
            }

            if (fields.isDeleted) {
                pose.isDeleted = fields.isDeleted;
                pose.markModified('isDeleted');
            }

            if (fields.rating) {
                pose.rating = fields.rating;
                pose.markModified('rating');
            }

            pose.update_time = Date.now();
            pose.markModified('update_time');

            category.save(function(err, updatedItem) {
                if (err) {
                    return res.status(400).json({ message: err.message });
                } else {
                    return res.json({ message: "Поза успешно обновлена", pose: pose });
                }
            });

        });

        var preview = [];
        var original = [];

        function addObjectInArray(array, file) {
            var dimensions = sizeOf(file.path);
            array.push({ url: file.path.slice(7),
                width: dimensions.width,
                height: dimensions.height
            });
        }

        form.on('file', function(name, file) {
            if (name == 'preview') {
                addObjectInArray(preview, file);
            }
            if (name == 'original') {
                addObjectInArray(original, file);
            }
        });
    });
}
// DELETE /api/v1/category/:category_id/pose/:pose_id/
function deleteImageFromCategoryFull(req, res, next) {
    if (req.params.key != KEY) return res.json({ message: "Permission denied"});

    model.CategoryModel.findById(req.params.category_id, function(err, category) {
        if (err) { res.json({ message: err.message }); }

        var pose = category.image_pose.id(req.params.pose_id);
        fs.removeSync('uploads/category/'+category.category_name_id + '/pose/' + pose.pose_name_id);
        pose.remove();

        category.save(function(err, updatedItem) {
            if (err) {
                return res.status(400).json({ message: err.message });
            } else {
                return res.json({ message: "Поза успешно удалена полностью" });
            }
        });

    });
}
// DELETE: /api/v1/category/:category_id/pose/:pose_id/safe
function deleteImageFromCategory(req, res, next) {
    if (req.params.key != KEY) return res.json({ message: "Permission denied"});

    model.CategoryModel.findById(req.params.category_id, function(err, category) {
        if (err) { res.json({ message: err.message }); }

        category.image_pose.forEach(function(elem) {
           if (elem._id == req.params.pose_id) {
               elem.isDeleted = true;
           }
        });

        category.markModified('image_pose');

        category.save(function(err, updatedItem) {
          if (err) {
            return res.status(400).json({ message: err.message });
          } else {
            return res.json({ message: "Поза успешно удалена" });
          }
        });
    });
}


function createSymbol(req, res, next) {
    //if (req.params.key != KEY) return res.json({ message: "Permission denied"});


        var symbol_name_id = makeId();
        var symbolPath = 'uploads/symbol/'+ symbol_name_id;

        fs.mkdirsSync(symbolPath);

        var form = formidable.IncomingForm();
        form.uploadDir = symbolPath;
        form.keepExtensions = true;
        form.multiples = true;
        form.type = 'multipart/form-data';

        form.parse(req, function(err, fields, files) {
            if (err) return res.json({ message: err.message });

            function sortAndScale(array) {
                array.sort(function(a,b) {return a.width - b.width});
                array[0]["scale"] = "small";
                array[1]["scale"] = "medium";
                array[2]["scale"] = "high";
            }
            sortAndScale(symbolImages);



            var symbol = new model.SymbolModel({
                symbol_image: symbolImages,
                symbol_name_id: symbol_name_id,
                symbol_svg: symbolSvg
            });

            symbol.save(function(err) {
                if (err) {
                  return res.status(400).json({ message: err.message });
                } else {
                  return res.json({ message: "Логотип успешно добавлен" });
                }
            });

        });

        var symbolImages = [];
        var symbolSvg = {};

        function addObjectInArray(array, file) {
            var dimensions = sizeOf(file.path);
            array.push({ url: file.path.slice(7),
                width: dimensions.width,
                height: dimensions.height
            });
        }

        form.on('file', function(name, file) {
            if (name == 'symbol') {
                addObjectInArray(symbolImages, file);
            }
            if (name == 'symbol_svg') {
                var dimensions = sizeOf(file.path);
                symbolSvg.url = file.path.slice(7);
                symbolSvg.width = dimensions.width;
                symbolSvg.height = dimensions.height;
                //addObjectInArray(symbolSvg, file);
            }
        });

}
function getSymbol(req, res, next) {
    model.SymbolModel.find({ }, function(err, symbol) {

        var resultSymbol = [];
        symbol.forEach(symbol_elem => {
            resultSymbol.push({
                id: symbol_elem._id,
                symbol_svg: symbol_elem.symbol_svg
            });
        });

        return res.json(resultSymbol);

    });
}

module.exports = {
    getAllCategory: getAllCategory,
    getSingleCategory: getSingleCategory,
    createCategory: createCategory,
    updateCategory: updateCategory,
    deleteCategoryFull: deleteCategoryFull,
    deleteCategory: deleteCategory,
    createImageInCategory: createImageInCategory,
    getAllImageFromCategory: getAllImageFromCategory,
    getSingleImageFromCategory: getSingleImageFromCategory,
    updateImageFromCategory: updateImageFromCategory,
    deleteImageFromCategoryFull: deleteImageFromCategoryFull,
    deleteImageFromCategory: deleteImageFromCategory,
    totalRemove: totalRemove,
    getFullInfo: getFullInfo,
    createSymbol: createSymbol,
    getSymbol: getSymbol,
    removeSymbol: removeSymbol//,
    //getSymbolById: getSymbolById
};
