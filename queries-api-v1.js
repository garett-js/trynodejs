var promise = require('bluebird');

var options = {
    promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connectionString = 'postgres://localhost:5432/kamasutra_db';
var db = pgp(connectionString);

// API V1 CATEGORY
// GET: /api/v1/category
function getAllCategory(req, res, next) {
    db.any('SELECT * FROM pcategory WHERE isdeleted = FALSE')
        .then(function(data) {
            res.json({
                status: 'success',
                data: data,
                message: 'GET all DATA'
            });
        })
        .catch(function(err) {
            return next(err);
        });
}
// GET: /api/v1/category/:id
function getSingleCategory(req, res, next) {
    db.any(`SELECT * FROM pcategory
            WHERE pcategory_id = ${req.params.id} AND isdeleted = FALSE`)
        .then(function(data) {
            res.json({
                status: 'success',
                data: data,
                message: 'GET Single DATA'
            });
        })
        .catch(function(err) {
            return next(err);
        });
}
// POST: /api/v1/category
function createCategory(req, res, next) {
    db.none(`INSERT INTO pcategory (pcategory_title, pcategory_image_url, design_url)
             VALUES ($1, $2, $3)`,
        [ req.body.title, req.body.image_url, req.body.design_url ])
        .then(function() {
            res.json({
                status: 'success',
                message: 'INSERT category'
            });
        })
        .catch(function(err) {
            return next(err);
        });
}
// PUT: /api/v1/category/:id
function updateCategory(req, res, next) {
    db.none(`UPDATE pcategory
             SET pcategory_title=$1,
                 pcategory_image_url=$2,
                 design_url=$3
             WHERE pcategory_id =$4 AND isdeleted = FALSE`,
             [ req.body.title, req.body.image_url, req.body.design_url, req.params.id ])
        .then(function() {
            res.json({
                status: 'success',
                message: 'UPDATE Category'
            });
        })
        .catch(function(err) {
            return next(err);
        });
}
// DELETE /api/v1/category/:id
function deleteCategoryFull(req, res, next) {
    db.result( `
        DELETE FROM pose
        WHERE pose_id IN (
            SELECT p.pose_id
            FROM pcategory
                JOIN nn_category_pose nn
                    ON nn.pcategory_id = pcategory.pcategory_id
                JOIN pose p
                    ON nn.pose_id = p.pose_id
            WHERE pcategory.pcategory_id = ${req.params.id} );

        DELETE FROM pcategory WHERE pcategory_id = ${req.params.id}` )
         .then(function(result) {
             res.json({
                status: 'success',
                message: `Full removed this Category and nested images`
             });
         })
         .catch(function(err) {
             return next(err);
         });
}
// DELETE /api/v1/category/:id/safe
function deleteCategory(req, res, next) {
    db.result( `
        UPDATE pcategory SET isdeleted = TRUE
        WHERE pcategory_id = ${req.params.id};

        UPDATE pose
        SET isdeleted = TRUE
            FROM (SELECT p.pose_id,
                         p.pose_title,
                         p.pose_image_url,
                         p.desc_short,
                         p.desc_full,
                         p.rating
                  FROM pcategory
                           JOIN nn_category_pose nn
                               ON nn.pcategory_id = pcategory.pcategory_id
                           JOIN pose p
                               ON nn.pose_id = p.pose_id
                       WHERE pcategory.pcategory_id =${req.params.id}
                 ) jointable
        WHERE pose.pose_id = jointable.pose_id` )
         .then(function(result) {
             res.json({
                status: 'success',
                message: `Removed this Category and nested images`
             });
         })
         .catch(function(err) {
             return next(err);
         });
}

// API V1 IMAGE FROM CATEGORY
// GET: /api/v1/category/:category_id/pose
function getAllImageFromCategory(req, res, next) {
    db.any(
        `SELECT p.pose_id, p.pose_title, p.pose_image_url, p.rating, p.desc_short, p.desc_full FROM pcategory
            JOIN nn_category_pose nn
                ON nn.pcategory_id = pcategory.pcategory_id
            JOIN pose p
                ON nn.pose_id = p.pose_id
         WHERE pcategory.pcategory_id =${req.params.category_id} AND p.isdeleted = FALSE`)
    .then(function(data) {
        res.json({
            status: 'success',
            data: data,
            message: 'GET ALL IMAGES FROM CATEGORY'
        });
    })
    .catch(function(err) {
        return next(err);
    });
}
// GET: /api/v1/category/:category_id/pose/:pose_id
function getSingleImageFromCategory(req, res, next) {
    db.any(
        `SELECT p.pose_id, p.pose_title, p.pose_image_url, p.rating, p.desc_short, p.desc_full FROM pcategory
            JOIN nn_category_pose nn
                ON nn.pcategory_id = pcategory.pcategory_id
            JOIN pose p
                ON nn.pose_id = p.pose_id
         WHERE pcategory.pcategory_id =${req.params.category_id} AND
               p.pose_id =${req.params.pose_id} AND p.isdeleted = FALSE`)
        .then(function(data) {
        res.json({
            status: 'success',
            data: data,
            message: `GET Single IMAGE ( id : ${req.params.im_id}) FROM CATEGORY ( id : ${req.params.cat_id})`
        });
    })
    .catch(function(err) {
        return next(err);
    });
}
// POST: /api/v1/category/:category_id/pose/
function createImageInCategory(req, res, next) {
    db.none(
        `WITH temp_pose(pose_id) AS (
            INSERT INTO pose (pose_title, pose_image_url, desc_short, desc_full, rating)
                VALUES ($1, $2, $3, $4, $5)
                    RETURNING pose_id
            )
        INSERT INTO nn_category_pose (pcategory_id, pose_id)
        VALUES ( ${req.params.category_id}, (SELECT pose_id FROM temp_pose) )`,
        [ req.body.title, req.body.image_url, req.body.desc_short, req.body.desc_full, req.body.rating ])
        .then(function() {
            res.json({
                status: 'success',
                message: "Insert image in category"
            });
        })
        .catch(function(err) {
            return next(err);
        });
}
// PUT: /api/v1/category/:category_id/pose/:pose_id
function updateImageFromCategory(req, res, next) {
    db.none(
        `UPDATE pose outpose
         SET pose_title=$1,
             pose_image_url=$2,
             desc_short=$3,
             desc_full=$4,
             rating=$5
         FROM (SELECT p.pose_id,
                      p.pose_title,
                      p.pose_image_url,
                      p.desc_short,
                      p.desc_full,
                      p.rating
               FROM pcategory
                   JOIN nn_category_pose nn
                       ON nn.pcategory_id = pcategory.pcategory_id
                   JOIN pose p
                       ON nn.pose_id = p.pose_id
               WHERE p.pose_id =${req.params.pose_id} AND pcategory.pcategory_id =${req.params.category_id}
         ) jointable
         WHERE outpose.pose_id = jointable.pose_id`,
         [ req.body.title, req.body.image_url, req.body.desc_short, req.body.desc_full, req.body.rating ])
        .then(function() {
        res.json({
            status: 'success',
            message: `UPDATE Single IMAGE ( id : ${req.params.im_id}) FROM CATEGORY ( id : ${req.params.cat_id})`
        });
    })
    .catch(function(err) {
        return next(err);
    });
}
// DELETE /api/v1/category/:category_id/pose/:pose_id/
function deleteImageFromCategoryFull(req, res, next) {
    db.result(
        `DELETE FROM pose
         WHERE pose_id IN (
             SELECT p.pose_id
             FROM pcategory
                 JOIN nn_category_pose nn
                     ON nn.pcategory_id = pcategory.pcategory_id
                 JOIN pose p
                     ON nn.pose_id = p.pose_id
             WHERE p.pose_id =${req.params.pose_id}  AND pcategory.pcategory_id = ${req.params.category_id} )` )
         .then(function(result) {
             res.json({
                status: 'success',
                message: `Removed ${result.rowCount} pose`
             });
         })
         .catch(function(err) {
             return next(err);
         });
}
// DELETE: /api/v1/category/:category_id/pose/:pose_id/safe
function deleteImageFromCategory(req, res, next) {
    db.result(
        `UPDATE pose
         SET isdeleted = TRUE
         FROM (SELECT p.pose_id,
                      p.pose_title,
                      p.pose_image_url,
                      p.desc_short,
                      p.desc_full,
                      p.rating
               FROM pcategory
                   JOIN nn_category_pose nn
                       ON nn.pcategory_id = pcategory.pcategory_id
                   JOIN pose p
                       ON nn.pose_id = p.pose_id
               WHERE p.pose_id =${req.params.pose_id} AND
                     pcategory.pcategory_id =${req.params.category_id}
         ) jointable
         WHERE pose.pose_id = jointable.pose_id` )
         .then(function(result) {
             res.json({
                status: 'success',
                message: `Removed ${result.rowCount} pose`
             });
         })
         .catch(function(err) {
             return next(err);
         });
}

function getImage(req, res, next) {}
function crateImage(req, res, next) {}
function ipdateImage(req, res, next) {}
function deleteImage(req, res, next) {}

module.exports = {
    getAllCategory: getAllCategory,
    getSingleCategory: getSingleCategory,
    createCategory: createCategory,
    updateCategory: updateCategory,
    deleteCategoryFull: deleteCategoryFull,
    deleteCategory: deleteCategory,
    getAllImageFromCategory: getAllImageFromCategory,
    getSingleImageFromCategory: getSingleImageFromCategory,
    createImageInCategory: createImageInCategory,
    updateImageFromCategory: updateImageFromCategory,
    deleteImageFromCategoryFull: deleteImageFromCategoryFull,
    deleteImageFromCategory: deleteImageFromCategory,
    getImage: getImage,
    crateImage: crateImage,
    ipdateImage: ipdateImage,
    deleteImage: deleteImage
}
