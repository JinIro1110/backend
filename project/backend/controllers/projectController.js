const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const db = require('../config/database');

exports.postsboard = (req, res) => {
    // 시작 페이지 숫자
    const page = req.query.page || 1;
    const itemsPerPage = 6; // 한 페이지에 출력할 개수

    // 게시물들의 개수 확인
    function getTotalPosts(callback) {
        const getTotalPostsQuery = 'SELECT COUNT(*) AS total FROM projects';
        db.query(getTotalPostsQuery, (err, totalResult) => {
            if (err) {
                return callback(err, null);
            }
            const totalPosts = totalResult[0].total;
            callback(null, totalPosts);
        });
    }

    // 특정 페이지의 게시물들 가져오기
    function getPostsForPage(page, itemsPerPage, callback) {
        const offset = (page - 1) * itemsPerPage;
        // 게시물을 id가 큰 순서대로=최근에 만든 순서대로 출력
        const query = `SELECT * FROM projects ORDER BY projectId DESC LIMIT ${itemsPerPage} OFFSET ${offset}`;
        db.query(query, (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
    }

    getTotalPosts((err, totalPosts) => {
        if (err) {
            console.error('Error fetching total posts:', err);
            return res.status(500).json({ error: 'An error occurred while fetching data' });
        }

        const totalPages = Math.ceil(totalPosts / itemsPerPage);

        getPostsForPage(page, itemsPerPage, (err, posts) => {
            if (err) {
                console.error('Error fetching posts:', err);
                return res.status(500).json({ error: 'An error occurred while fetching data' });
            }
            res.json({ totalPages, posts });
        });
    });
};

exports.createProjects = async (req, res) => {
    try {
        console.log(req.headers.authorization);
        const jwtToken = req.headers.authorization.split(' ')[1]; // 헤더에서 JWT 추출
        const decodedToken = jwt.verify(jwtToken, 'your_jwt_secret_key'); // JWT 디코딩
        const leaderEmail = decodedToken.email; // 이메일 추출
        const projectName = req.body.projectName;
        const selectedField = req.body.selectedField;
        const selectedMajorField = req.body.majorField;
        const selectedSubField = req.body.subField;
        const selectedArea = req.body.selectedArea;
        const description = req.body.description;
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;
        const numOfRole = req.body.numOfRole;
        const projectData = req.body.projectData;
        const projectId = await insertProject(projectName, fieldId, selectedArea, description, startDate, endDate, leaderEmail);

        for (const data of projectData) {
            const { majorField, subField, numOfRole } = data;
            const majorFieldValue = majorField.split(': ')[1];
            const subFieldValue = subField.split(': ')[1];
            const numOfRoleValue = numOfRole.split(': ')[1];
            const majorFieldId = await getMajorFieldId(majorFieldValue);
            const subFieldId = await getSubFieldId(subFieldValue);

            await insertRecruitment(majorFieldId, subFieldId, numOfRoleValue, projectId);
        }



        res.status(200).json({ message: '프로젝트 및 모집 현황이 성공적으로 등록되었습니다.' });
    } catch (error) {
        console.error('Error creating project and recruitment:', error);
        res.status(500).json({ message: 'Failed to create project and recruitment' });
    }
};

async function insertProject(projectName, field, area, description, startDate, endDate, leaderEmail) {
    return new Promise((resolve, reject) => {
        const insertProjectQuery = 'INSERT INTO Projects (ProjectName, Field, Area, Description, StartDate, EndDate, Leader, Tech) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const projectValues = [projectName, field, area, description, startDate, endDate, leaderEmail];
        db.query(insertProjectQuery, projectValues, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.insertId);
            }
        });
    });
}

async function insertRecruitment(majorFieldId, subFieldId, numOfRole, projectId) {
    return new Promise((resolve, reject) => {
        const insertRecruitmentQuery = 'INSERT INTO Recruitment (MajorField, SubField, NumOfRole, ProjectId) VALUES (?, ?, ?, ?)';
        const recruitmentValues = [majorField, subField, numOfRole, projectId];
        db.query(insertRecruitmentQuery, recruitmentValues, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

exports.recruitPage = async (req, res) => {
    const projectId = req.query.id;
    try {
        db.query(`
        SELECT p.ProjectName, p.FieldId, f.Field, p.Area, p.Description, p.StartDate, p.EndDate
        FROM Projects AS p
        JOIN Fields AS f ON p.FieldId = f.FieldId
        WHERE p.ProjectId = ?;
    `, [projectId], (err, result) => {
            console.log(result);
            if (err) {
                console.error('Error fetching project data:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const { ProjectName, Field, Area, Description, StartDate, EndDate } = result[0];

            // Send JSON response
            res.json({
                projectId,
                ProjectName,
                Field,
                Area,
                Description,
                StartDate,
                EndDate,
            });
        });
    } catch (error) {
        console.error('Error fetching recruit page data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.startProject = async (req, res) => {
    const projectId = req.params.projectId;

    // 프로젝트 시작 로직 수행

    try {
        // 프로젝트 정보 업데이트 (예: 상태를 "ongoing"으로 변경)
        const updateProjectQuery = 'UPDATE Projects SET Status = "ongoing" WHERE ProjectId = ?';
        await db.query(updateProjectQuery, [projectId]);

        // recruitment 정보 삭제
        const deleteRecruitmentQuery = 'DELETE FROM Recruitments WHERE ProjectId = ?';
        await db.query(deleteRecruitmentQuery, [projectId]);

        // "waiting" 상태의 멤버 제거
        const deleteWaitingMembersQuery = 'DELETE FROM Members WHERE ProjectId = ? AND Status = "waiting"';
        await db.query(deleteWaitingMembersQuery, [projectId]);

        return res.status(200).json({ message: 'Project started successfully.' });
    } catch (error) {
        console.error('Error starting project:', error);
        return res.status(500).json({ message: 'An error occurred while starting the project.' });
    }
};

