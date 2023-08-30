const express = require('express');
const app = express();
const session = require('express-session');
const cors = require('cors'); // cors 패키지 불러오기
const path = require('path');
require('dotenv').config();
const cookieparser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const memberRoutes = require('./routes/memberRoutes');
const db = require('./config/database');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');

// 매일 자정에 실행되도록 스케줄을 설정합니다.
cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date();
        const deleteQuery = 'DELETE FROM Auth WHERE expiration <= ?';
        const result = await db.query(deleteQuery, [now]);

        console.log(`${result.affectedRows} expired tokens deleted.`);
    } catch (error) {
        console.error('Error deleting expired tokens:', error);
    }
});


// CORS 설정 적용
app.use(cors());

// 미들웨어 설정
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieparser());
app.use(session({
    secret: process.env.SECRET_KEY, // 세션 데이터를 암호화하기 위한 시크릿 키
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false
    }
}));
app.use((req, res, next) => {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', 0);
    next();
});
app.use('/api/auth', authRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/recruit', recruitmentRoutes);
app.use('/api/member', memberRoutes);
app.use(express.static(path.join(__dirname, '../frontend/dist')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/main.html'));
    if (req.session.email) {
        console.log('Welcome to the main page (Logged in)');
    } else {
        console.log('Welcome to the main page (Not logged in)');
    }
});

// 회원가입
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/signup.html'));
});

// 로그인
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/login.html'));
})

// 아이디 찾기
app.get('/search/Id', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/searchId.html'));
})

// 패스워드 찾기
app.get('/search/Password', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/searchPassword.html'));
})

// 토큰 검증
app.get('/verifyToken/:token', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/verifyToken.html'));
})

// 패스워드 변경
app.get('/updatePassword/:token', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/updatePassword.html'));
});

// 게시판
app.get('/pagination', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/board.html'));
})

// 게시물 작성
app.get('/createProject', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/create_projects.html'));
})


// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
