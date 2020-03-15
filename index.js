const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { User } = require('./models/user');
const { auth } = require('./middleware/auth');
const config = require('./config/key');

mongoose.connect(config.mongoURI, {
    useNewUrlParser : true,
    useUnifiedTopology : true,
    useCreateIndex : true,
    useFindAndModify : false
}).then(() => console.log('MongoDB Connected....')).catch(err => console.log(err));
//

// middleware
app.use(bodyParser.urlencoded({ extended : true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/', (req, res) => res.send('Hello World'));

app.post('/api/users/register', (req, res) => {
    const user = new User(req.body);

    user.save((err, doc) => {
        if(err) return res.json({sucess:false, err});
        return res.status(200).json({sucess:true});
    });
});

app.post('/api/users/login', (req, res) => {
    console.log(`user find start ${req.body.email}`);
    // 요청된 EMAIL주소로 DB에서 SELECT
    User.findOne({email: req.body.email}, (err, user) => {
        if(!user) return res.json({loginSucess: false, message: '등록된 이메일 정보가 없습니다.'});
        console.log(`email is finded ${user.email}`);

        // 비밀번호 검증
        user.comparePassword(req.body.password, (err, isMatch) => {
            console.log(`password compare is ${isMatch}`);
            if(!isMatch) return res.status(400).send({loginSucess: false, message: '비밀번호가 일치하지 않습니다.'});

            // 로그인 토큰 생성
            user.generateToken((err, user) => {
                if(err) return res.status(400).send(err);
                // 토큰을 저장한다. (쿠키, 로컬스토리지 등)
                res.cookie('x_auth', user.token).status(200).json({loginSucess: true, userId: user._id});
            });
        })
    });
});

//Router
app.get('/api/users/auth', auth, (req, res) => {
  // 여기까지 미들웨어를 통과해 왔다는 얘기는 Authentication이 TRUE라는 말
  res.status(200).json({
      _id:req.user._id,
      isAdmin:req.user.role===0?false:true,
      isAuth:true,
      email:req.user.email,
      name:req.user.name,
      lastname:req.user.lastname,
      role:req.user.role,
      image:req.user.image
  })
});

app.get('/api/users/logout', auth, (req, res) => {
    console.log(`logout start ${req.user._id}`);
    User.findOneAndUpdate({_id:req.user._id}, {token:""}, (err, user) => {
        if(err) return res.json({sucess:false, err});
        return res.status(200).send({sucess:true});
    });
});

app.listen(port, () => console.log(`APP listening port ${port}`));
