DROP DATABASE IF EXISTS kamasutra_db;
CREATE DATABASE kamasutra_db;

\c kamasutra_db;

CREATE TABLE pcategory (
    pcategory_id SERIAL PRIMARY KEY,
    pcategory_title VARCHAR NOT NULL,
    pcategory_image_url VARCHAR NOT NULL,
    design_url VARCHAR NOT NULL,
    isdeleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE pose (
    pose_id SERIAL PRIMARY KEY,
    pose_title VARCHAR NOT NULL,
    pose_image_url VARCHAR NOT NULL,
    rating REAL NOT NULL,
    desc_short TEXT NOT NULL,
    desc_full TEXT NOT NULL,
    isdeleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE nn_category_pose (
    pcategory_id integer REFERENCES pcategory (pcategory_id) ON UPDATE CASCADE ON DELETE CASCADE,
    pose_id integer REFERENCES pose (pose_id) ON UPDATE CASCADE ON DELETE CASCADE,
    category_pose_pkey SERIAL PRIMARY KEY
);

--WITH im(im_id) AS (
--        INSERT INTO categories_poses (title, image_url, design_url)
--            VALUES ('SIMPLE TITLE TEST', '/TEST_URL.PNG', '/TEST_URL.PNG')
--                RETURNING categories_poses_id
--     ),
--     cat(cat_id) AS (
--        INSERT INTO poses(title, rating, image_url, desc_short, desc_full, deleted)
--            VALUES ('SIMPLE TITLE TEST', 4.5, '/TEST_URL.PNG', 'TEST_SHORT', 'TEST_FULL', FALSE)
--                RETURNING poses_id
--     )
--INSERT INTO ref_categories_poses (categories_poses_id, poses_id)
--   VALUES ((SELECT cat_id FROM cat), (SELECT im_id FROM im));
