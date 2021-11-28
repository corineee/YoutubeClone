const express = require("express");
const { Subscriber } = require("../models/Subscriber");
const router = express.Router();
// const { Video } = require("../models/User");

const { auth } = require("../middleware/auth");
const multer = require("multer");
var ffmpeg = require("fluent-ffmpeg");
const { Video } = require("../models/Video");
const { Subscriber } = require("../models/Subscriber");

//STORAGE MULTER CONFIG
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //upload폴더에 모두 저장이 된다.
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }, //날짜_파일네임 이런식으로 나온다.
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== ".mp4") {
      //mp4만 가능
      return cb(res.status(400).end("only mp4 is allowed"), false);
    }
    cb(null, true);
  },
});

const upload = multer({ storage: storage }).single("file");

//=================================
//             Video
//=================================

router.post("/uploadVideo", (req, res) => {
  // 비디오 정보들을 저장한다.
  const video = new Video(req.body); //모든 variables를 가져온다.

  video.save((err, doc) => {
    //모든 정보들이 mongodb에 저장이된다.
    if (err) return res.json({ success: false, err });
    res.status(200).json({ success: true });
  });
});

router.get("/getVideos", (req, res) => {
  // 비디오를 DB 에서 가져와서 클라이언트에 보낸다.
  Video.find()
    .populate("writer") //populate를 해서 모든 writer정보를 가져올 수 있다.
    .exec((err, videos) => {
      if (err) return res.status(400).send(err);
      res.status(200).json({ success: true, videos });
    });
});

//=================================
//             User
//=================================

router.post("/uploadfiles", (req, res) => {
  // 비디오를 서버에 저장한다. npm install multer --save를 해준다.(노드 서버에 파일을 저장하기 위한 Dependency)
  upload(req, res, (err) => {
    if (err) {
      return res.json({ success: false, err });
    }
    return res.json({
      success: true,
      url: res.req.file.path,
      fileName: res.req.file.filename,
    }); //upload하는 폴더안에 넣어주는 경로
  });
});

router.post("/getVideoDetail", (req, res) => {
  Video.findOne({ _id: req.body.videoId })
    .populate("writer")
    .exec((err, videoDetail) => {
      if (err) return res.status(400).send(err);
      return res.status(200).json({ success: true, videoDetail });
    });
});

router.post("/thumbnail", (req, res) => {
  let filePath = "";
  let fileDuration = "";

  // 비디오 정보 가져오기
  ffmpeg.ffprobe(req.body.url, function (err, metadata) {
    console.dir(metadata); // all metadata
    console.log(metadata.format.duration);
    fileDuration = metadata.format.duration;
  });

  // 썸네일 생성
  ffmpeg(req.body.url)
    .on("filenames", function (filenames) {
      console.log("Will generate" + filenames.join(","));
      console.log(filenames);

      filePath = "uploads/thumbnails/" + filenames[0];
    })
    .on("end", function () {
      // 썸네일을 생성하고 무엇을 하는지
      console.log("Screenshots taken");
      return res.json({
        success: true,
        url: filePath,
        fileDuration: fileDuration,
      });
    })
    .on("error", function (err) {
      // 에러가 났을 경우
      console.log(err);
      return res.json({ success: false, err });
    })
    .screenshots({
      //옵션 부여 가능
      // Will take screenshots at 20%, 40%, 60% and 80% of the video
      count: 3,
      folder: "uploads/thumbnails",
      size: "320x240",
      //'%b' : input basename (filename w/o extension)
      filename: "thumbnail-%b.png",
    });
});

router.post("/getSubscriptionVideos", (req, res) => {
  // 자신의 아이디를 가지고 구독하는 사람들을 찾는다.

  Subscriber.find({ userFrom: req.body.userFrom }).exec(
    (err, subscriberInfo) => {
      if (err) return res.status(400).send(err);

      let subscribedUser = [];

      subscriberInfo.map((subscriber, i) => {
        subscribedUser.push(subscriber.userTo);
      });

      // 찾은 사람들의 비디오를 가지고 온다.
      Video.find({ writer: { $in: subscribedUser } }) //mongodb method인 in을 사용하면 들어있는 모든사람들의 정보를 가질 수 있다.
        .populate("writer")
        .exec((err, videos) => {
          if (err) return res.status(400).send(Err);
          res.status(200).json({ success: true, videos });
        });
    }
  );
});

module.exports = router;
