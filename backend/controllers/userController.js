const db = require('../config/database');
const jwt = require('jsonwebtoken');
const getEmailFromToken = require('../utils/email');

exports.userProfile = (req, res) => {
    try {
        const accessToken = req.cookies.jwt;

        const userEmail = getEmailFromToken(accessToken);
        if (!userEmail) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // 여기서 userEmail을 사용하여 프로필 정보를 데이터베이스에서 조회하는 쿼리 실행
        const query = 'SELECT * FROM Users WHERE Email = ?';
        db.query(query, [userEmail], (err, result) => {
            if (err) {
                console.error('Error fetching user profile:', err);
                return res.status(500).json({ message: 'Failed to fetch user profile' });
            }

            // result에서 필요한 프로필 정보 추출 후 응답
            const userProfile = {
                email: result[0].Email,
                name: result[0].Name,
                cooperationType: result[0].CooperationType,
                onOff: result[0].OnOff,
                techs: result[0].Techs,
                description: result[0].Description
            };

            return res.status(200).json(userProfile);
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ message: 'An error occurred while fetching user profile' });
    }
};


exports.recruitingProject = (req, res) => {
    try {
        const token = req.cookies.jwt; // 쿠키에서 토큰을 가져옵니다.

        // 토큰 검증 후 이메일 추출
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userEmail = decodedToken.email;

        const query = 'SELECT * FROM Projects WHERE Leader = ? AND Status = "ready"';
        db.query(query, [userEmail], (err, results) => {
            if (err) {
                console.error('Error fetching recruiting projects:', err);
                res.status(500).json({ message: 'Failed to fetch recruiting projects' });
                return;
            }

            res.status(200).json({ projects: results });
        });
    } catch (error) {
        console.error('Error fetching recruiting projects:', error);
        res.status(500).json({ message: 'Failed to fetch recruiting projects' });
    }
};

exports.appliedProject = (req, res) => {
    try {
        const token = req.cookies.jwt; // 쿠키에서 토큰을 가져옵니다.

        // 토큰 검증 후 이메일 추출
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userEmail = decodedToken.email;

        // MemberEmail이 userEmail이고 Status가 'waiting'인 프로젝트 중 Status가 'ready'인 프로젝트들을 가져옵니다.
        const query = `
        SELECT P.ProjectId, P.ProjectName, P.Field, P.Area, P.Description, P.StartDate, P.EndDate, P.Status
        FROM Projects AS P
        INNER JOIN Members AS M ON P.ProjectId = M.ProjectId
        WHERE M.MemberEmail = ? AND M.Status = 'waiting' AND P.Status = 'ready'`;

        db.query(query, [userEmail], (err, results) => {
            if (err) {
                console.error('Error fetching applied projects:', err);
                return res.status(500).json({ message: 'Failed to fetch applied projects.' });
            }

            return res.status(200).json({ projects: results });
        });
    } catch (error) {
        console.error('Error fetching applied projects:', error);
        return res.status(500).json({ message: 'An error occurred while fetching applied projects.' });
    }
};


exports.OnGoingProject = (req, res) => {
    try {
        const token = req.cookies.jwt; // 쿠키에서 토큰을 가져옵니다.

        // 토큰 검증 후 이메일 추출
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userEmail = decodedToken.email;

        const query = `
            SELECT P.ProjectId, P.ProjectName, P.Field, P.Area, P.Description, P.StartDate, P.EndDate, P.Status
            FROM Projects AS P
            INNER JOIN Members AS M ON P.ProjectId = M.ProjectId
            WHERE (P.Leader = ? OR M.MemberEmail = ?) AND P.Status = 'ongoing'`;

        db.query(query, [userEmail, userEmail], (err, results) => {
            if (err) {
                console.error('Error fetching ongoing projects:', err);
                return res.status(500).json({ message: 'Failed to fetch ongoing projects.' });
            }

            return res.status(200).json({ projects: results });
        });
    } catch (error) {
        console.error('Error fetching ongoing projects:', error);
        return res.status(500).json({ message: 'An error occurred while fetching ongoing projects.' });
    }
};


exports.FinishedProject = (req, res) => {
    try {
        const token = req.cookies.jwt; // 쿠키에서 토큰을 가져옵니다.

        // 토큰 검증 후 이메일 추출
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userEmail = decodedToken.email;

        const query = `
            SELECT P.ProjectId, P.ProjectName, P.Field, P.Area, P.Description, P.StartDate, P.EndDate, P.Status
            FROM Projects AS P
            INNER JOIN Members AS M ON P.ProjectId = M.ProjectId
            WHERE (P.Leader = ? OR M.MemberEmail = ?) AND P.Status = 'finished'`;

        db.query(query, [userEmail, userEmail], (err, results) => {
            if (err) {
                console.error('Error fetching finished projects:', err);
                return res.status(500).json({ message: 'Failed to fetch finished projects.' });
            }

            return res.status(200).json({ projects: results });
        });
    } catch (error) {
        console.error('Error fetching finished projects:', error);
        return res.status(500).json({ message: 'An error occurred while fetching finished projects.' });
    }
};
