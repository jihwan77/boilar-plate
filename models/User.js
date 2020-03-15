const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10; //salt 생성
const userSchema = mongoose.Schema({
    name : { type : String, maxlength : 50 },
    email : { type : String, trim : true, unique : 1 },
    password : { type : String, minlength : 5 },
    lastname : { type : String, maxlength : 50 },
    role : { type : Number, default : 0 },
    image : String,
    token : { type : String },
    tokenExp : { type : Number }
});

userSchema.pre('save', function(next) {
    const user = this;
    console.log('save in');
    if(user.isModified('password')) {
        // 비밀번호 암호화
        console.log('password is modified');
        
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if(err) return next(err);
            console.log(`salt is ${salt}`);
            console.log(`user.password is ${user.password}`);
            bcrypt.hash(user.password, salt, (err, hash) => {
                if(err) return next(err);
                console.log(`hash is ${hash}`);
                user.password = hash;
                next();
            });
        });
    } else {
        console.log('password is not modified');
        next();
    }
});

userSchema.methods.comparePassword = function(plainPassword, callback) {
    const user = this;
    console.log(`comparePassword in ${user.password}`);
    bcrypt.compare(plainPassword, user.password, (err, isMatch) => {
        if(err) return callback(err);
        callback(null, isMatch);
    });
};

userSchema.methods.generateToken = function(callback) {
    const user = this;
    const token = jwt.sign(user._id.toHexString(), 'secretToken');
    user.token = token;
    user.save((err, user) => {
        if(err) return callback(err);
        callback(null, user);
    })
}

userSchema.statics.findByToken = function(token, callback) {
    const user = this;
    jwt.verify(token, 'secretToken', (err, decoded) => {
        // user-id를 이용하여 토큰을 찾은후 클라이언트에서 가져온 token과 db에 보관된 token이 일치하는지 확인
        user.findOne({"_id":decoded,"token":token}, (err, user) => {
            if(err) return callback(er);
            callback(null, user);
        });
    });
}

const User = mongoose.model('User', userSchema);
module.exports = {User};