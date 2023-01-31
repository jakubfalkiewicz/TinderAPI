const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const getSign = require("horoscope").getSign;
const User = require("../models/User");
const axios = require("axios");
const fs = require("fs").promises;
const open = require("open");

function rad(x) {
  return (x * Math.PI) / 180;
}

function getDistance(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat - p1.lat);
  var dLong = rad(p2.lng - p1.lng);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat)) *
      Math.cos(rad(p2.lat)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
}

function getAge(dateString) {
  var today = new Date();
  var birthDate = new Date(dateString);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function countCommonElements(arr1, arr2) {
  let count = 0;
  arr1.forEach((element) => {
    if (arr2.includes(element)) count++;
  });
  return count;
}

router.post("/insertMany", async (req, res) => {
  try {
    const users = usersData.map((el, index) => ({
      ...el,
      password: `password${index + 1}`,
    }));
    users.forEach(async (user) => {
      const date = user.birthDate.slice(0, 10).split("-");
      const city = await axios
        .get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${user.address[0].lat},${user.address[0].lng}&key=${process.env.GOOGLE_API_KEY}`
        )
        .then(
          (e) =>
            e.data.results[0].address_components[2].long_name +
            ", " +
            e.data.results[0].address_components[3].long_name
        );
      const newUser = new User({
        ...user,
        zodiacSign: getSign({
          month: parseInt(date[1]),
          day: parseInt(date[2]),
        }),
        city: city,
        age: getAge(user.birthDate),
      });
      const userSave = await newUser.save();
    });

    res.json({ message: "Data saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

router.post("/save/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    await fs.writeFile(`${req.body.fileName}.json`, JSON.stringify(user));
    res.json({ message: "User saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

router.post("/import", async (req, res) => {
  try {
    const data = JSON.parse(
      await fs.readFile(`${req.body.fileName}.json`, "utf-8")
    );
    const date = data.birthDate.slice(0, 10).split("-");
    const city = await axios
      .get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${data.address[0].lat},${data.address[0].lng}&key=${process.env.GOOGLE_API_KEY}`
      )
      .then((e) => e.data.results[0].address_components[3].long_name);
    const newUser = new User({
      ...data,
      zodiacSign: getSign({ month: parseInt(date[1]), day: parseInt(date[2]) }),
      city: city,
      age: getAge(data.birthDate),
    });
    const user = await newUser.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Create user
router.post("/register", async (req, res) => {
  try {
    const date = req.body.birthDate.slice(0, 10).split("-");
    const city = await axios
      .get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${req.body.address[0].lat},${req.body.address[0].lng}&key=${process.env.GOOGLE_API_KEY}`
      )
      .then((e) => e.data.results[0].address_components[3].long_name);
    const newUser = new User({
      ...req.body,
      zodiacSign: getSign({ month: parseInt(date[1]), day: parseInt(date[2]) }),
      city: city,
      age: getAge(req.body.birthDate),
    });
    const user = await newUser.save();
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).exec();
    if (!user) {
      return res.status(400).send({ message: "The email does not exist" });
    }
    user.comparePassword(req.body.password, (error, match) => {
      if (!match) {
        return res.status(400).send({ message: "The password is invalid" });
      }
    });
    res.send({ ...user._doc, logged: true });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Add new match
router.post("/addMatch/:id", async (req, res) => {
  try {
    if (req.params.id === req.body.id) {
      return res
        .status(404)
        .json({ error: "User1 and User2 are the same person" });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User1 not found" });
    }
    const user2 = await User.findById(req.body.id);
    if (!user2) {
      return res.status(404).json({ error: "User2 not found" });
    }
    if (user.matches.includes(req.body.id)) {
      return res.status(404).json({ error: "Already matched" });
    }
    user.matches.push(mongoose.Types.ObjectId(req.body.id));
    await User.updateOne({ _id: req.params.id }, { matches: user.matches });
    user2.matches.push(mongoose.Types.ObjectId(req.params.id));
    await User.updateOne({ _id: req.body.id }, { matches: user2.matches });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all users
router.get("/", async (_req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/map", async (_req, res) => {
  try {
    const users = await User.find();
    open("http://localhost:3000");
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get distance between users
router.get("/distance", async (req, res) => {
  try {
    const user1 = await User.findById(req.body.user1);
    const user2 = await User.findById(req.body.user2);
    const distance = Math.floor(
      getDistance(user1.address[0], user2.address[0]) / 1000
    );
    res.json(
      distance === 0
        ? { distance: "Less than a kilometer away" }
        : { distance: distance + "KM" }
    );
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get sorted interests list
router.get("/interests", async (_req, res) => {
  try {
    const interests = await User.aggregate([
      { $project: { _id: 0, interests: 1 } },
      { $unwind: "$interests" },
      { $group: { _id: "$interests", tags: { $sum: 1 } } },
      { $project: { _id: 0, interest: "$_id", tags: 1 } },
      { $sort: { tags: -1 } },
    ]);
    res.json(interests);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get gender/orientation distribution
router.get("/gender-orientation", async (_req, res) => {
  try {
    const orientation = await User.aggregate([
      {
        $group: {
          _id: { gender: "$gender", orientation: "$orientation" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          gender: "$_id.gender",
          orientation: "$_id.orientation",
          count: 1,
        },
      },
    ]);
    res.json(orientation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get matches distribution
router.get("/matchRanking", async (_req, res) => {
  try {
    const orientation = await User.aggregate([
      {
        $addFields: {
          matchesCount: { $size: "$matches" },
        },
      },
      {
        $sort: {
          matchesCount: -1,
        },
      },
      {
        $project: {
          _id: 0,
          gender: 1,
          orientation: 1,
          matches: "$matchesCount",
          city: 1,
        },
      },
    ]);
    res.json(orientation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get specific user
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get best bit for a user
router.get("/bestFit/:id", async (req, res) => {
  try {
    const range = req.body.range || 99999;
    const user = await User.findById(req.params.id);
    const usersList = await User.find();
    let result = usersList
      .filter((e) => e._id.toString() !== user._id.toString())
      .map((el) => ({
        ...el._doc,
        distance: Math.floor(
          getDistance(user.address[0], el.address[0]) / 1000
        ),
      }))
      .filter((e) => e.distance < range);
    if (user.orientation == "straight") {
      result = result.filter(
        (us) =>
          us.gender !== user.gender && us.orientation !== ("gay" && "lesbian")
      );
    } else if (user.orientation === "bisexual") {
      result = result.filter((us) =>
        user.gender === "male"
          ? us.orientation === ("bisexual" && "gay")
          : us.orientation === ("bisexual" && "lesbian")
      );
    } else {
      result = result.filter((us) => us.orientation === user.orientation);
    }
    result = result
      .filter(
        (us) =>
          user.ageRangeTo > getAge(us.birthDate) &&
          getAge(us.birthDate) > user.ageRangeFrom &&
          us.ageRangeTo > getAge(user.birthDate) &&
          getAge(user.birthDate) > us.ageRangeFrom
      )
      .sort(function (a, b) {
        return a.distance - b.distance;
      })
      .sort(function (a, b) {
        return (
          countCommonElements(b.interests, user.interests) -
          countCommonElements(a.interests, user.interests)
        );
      });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a user by ID
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (req.body.birthDate) {
      const date = req.body.birthDate.slice(0, 10).split("-");
      await User.updateOne(
        { _id: req.params.id },
        {
          ...req.body,
          zodiacSign: getSign({
            month: parseInt(date[1]),
            day: parseInt(date[2]),
          }),
          age: getAge(req.body.birthDate),
        }
      );
    } else {
      await User.updateOne({ _id: req.params.id }, req.body);
    }
    if (req.body.address) {
      const city = await axios
        .get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${req.body.address[0].lat},${req.body.address[0].lng}&key=${process.env.GOOGLE_API_KEY}`
        )
        .then(
          (e) =>
            e.data.results[0].address_components[2].long_name +
            ", " +
            e.data.results[0].address_components[3].long_name
        );
      await User.updateOne({ _id: req.params.id }, { ...req.body, city: city });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a user by ID
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await User.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
module.exports = router;
