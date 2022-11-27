const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  const newUser = new User({
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    firstName: req.body.firstName,
    lastName: req.body.lastName,
  });
  newUser.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
    } else {
      res.status(200).send({ message: "User was registered successfully!" });
    }
  });
};

exports.login = (req, res) => {
  User.findOne({
    email: req.body.email,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!user) {
      return res.status(404).send({
        id: null,
        message: "User not found.",
      });
    }

    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password.",
      });
    }

    let token = jwt.sign({ user }, config.secret);

    res.status(200).send({
      token: token,
      id: user.id,
      customerId: user.customerId,
    });
  });
};

exports.profile = (req, res) => {
  let id = req.userId;
  User.findById(id, function (err, docs) {
    if (err) {
      console.log(err);
      res.status(404).send({
        id: null,
        message: "User not found.",
      });
    } else {
      res.status(200).send({
        message: "Success",
        data: docs,
      });
    }
  });
};

exports.updateUser = (req, res) => {
  let user = { firstName: req.body.firstName, lastName: req.body.lastName };
  let id = req.userId;

  User.findByIdAndUpdate(id, user, {
    useFindAndModify: false,
    runValidators: true,
  })
    .then((user) => {
      if (user) {
        res.status(200).send("success");
      } else {
        let err = new Error("Cannot find user with id " + id);
        res.status(404).send(err);
      }
    })
    .catch((err) => {
      res.status(400).send(err);
    });
};

exports.verifyToken = (req, res, next) => {
  let token = req.query.token;

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.email = decoded.user.email;
    req.customerId = decoded.user.customerId;
    req.userId = decoded.user._id;
    next();
  });
};

exports.newMeasurement = (req, res) => {
  User.findOne({ email: req.email }, (err, user) => {
    var measurement = req.body.measurement;
    var date = new Date().toISOString().slice(0, 10);
    User.updateOne(
      { email: user.email },
      { $push: { history: { measurement, date } } },
      { safe: true, new: true },
      (err, user) => {
        if (err) {
          return res.status(500).send(err);
        } else {
          res
            .status(200)
            .send({ message: "Measurement was successfully added!" });
        }
      }
    );
  });
};

exports.getHistory = (req, res) => {
  User.aggregate(
    [
      {
        $unwind: {
          path: "$history",
        },
      },
      {
        $match: {
          email: req.email,
        },
      },
      { $project: { history: 1 } },
    ],
    (err, data) => {
      if (err) {
      } else {
        res.status(200).send(data);
      }
    }
  );
};
