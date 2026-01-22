const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const { MasterList, Profile_Image } = require("../db/models/associations");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


module.exports = router;
