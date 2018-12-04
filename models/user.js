const mongoose = require('mongoose');
const r = require('./../lib/reddit')();

const { Schema } = mongoose;

const userSchema = new Schema({
  username: String,
  score: {
    type: Number,
    default: 0,
  },
});

userSchema.statics.findOrCreate = function findOrCreate(username, callback) {
  const self = this;
  const regExName = new RegExp(username, 'i');
  const regExCondition = { username: { $regex: regExName } };
  self.findOne(regExCondition, (err, result) => {
    return result ? callback(err, result) : self.create({ username }, (err, result) => { return callback(err, result) });
  });
};

userSchema.statics.getTen = function getTen(direction, callback) {
  const self = this;
  self.find({})
    .sort({ score: direction })
    .limit(10)
    .exec(callback);
};

userSchema.statics.verifyRedditUserExists = function verifyRedditUserExists(username, create) {
  const self = this;
  return new Promise((resolve) => {
    r.getUser(username)
      .getOverview()
      .then((redditUser) => {
        if (create) {
          const user = new self({
            username: redditUser[0].author.name,
            score: 0,
          });

          user.save((err) => {
            if (!err) {
              resolve(user);
            }
          });
        } else {
          resolve({ error: 'User exists but was not created' });
        }
      })
      .catch(() => {
        resolve({ error: 'Reddit user does not exist' });
      });
  });
};

userSchema.statics.getOverallRank = function getOverallRank(user) {
  const self = this;
  return new Promise((resolve) => {
    self.find({})
      .sort({ score: -1 })
      .exec((err, users) => {
        const userPosition = users.map(x => x.username).indexOf(user.username);
        const userFound = users[userPosition]._doc;
        userFound.rank = userPosition + 1;
        resolve(userFound);
      });
  });
};

module.exports = mongoose.model('User', userSchema);
