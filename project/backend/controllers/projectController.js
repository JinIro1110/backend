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
            console.log(totalPages);
            console.log(posts);
            res.json({ totalPages, posts });
        });
    });
};

exports.showfield = (req, res) => {
    db.query('SELECT field FROM fields ORDER BY fieldId;', (err, fields) => {
        if (err) {
            console.error('Error fetching fields:', err);
            res.status(500).json({ message: 'Failed to fetch fields' });
        } else {
            const fieldValues = fields.map(item => item.field); // 수정: item.fieldName을 item.field로 변경
            res.status(200).json({ field: fieldValues }); // 수정: fieldNames 대신 field로 변경
        }
    });
}

exports.showMajorFields = (req, res) => {
    db.query('SELECT MajorFieldId, MajorField FROM MajorField ORDER BY MajorFieldId;', (err, majorFields) => {
        if (err) {
            console.error('Error fetching major fields:', err);
            res.status(500).json({ message: 'Failed to fetch major fields' });
        } else {
            const majorFieldValues = majorFields.map(item => ({
                majorFieldId: item.MajorFieldId,
                majorField: item.MajorField
            }));
            res.status(200).json(majorFieldValues);
        }
    });
};

exports.showSubFields = (req, res) => {
    const majorFieldId = req.params.majorFieldId;

    db.query('SELECT SubFieldId, SubField FROM SubField WHERE MajorFieldId = ? ORDER BY SubFieldId;', [majorFieldId], (err, subFields) => {
        if (err) {
            console.error('Error fetching sub fields:', err);
            res.status(500).json({ message: 'Failed to fetch sub fields' });
        } else {
            const subFieldValues = subFields.map(item => ({
                subFieldId: item.SubFieldId,
                subField: item.SubField
            }));
            res.status(200).json(subFieldValues);
        }
    });
};


exports.createProjects = async (req, res) => {
    console.log(req.body);
    const projectName = req.body.projectName;
    const selectedField = req.body.selectedField;
    const selectedMajorField = req.body.majorField;
    const selectedSubField = req.body.subField;
    const selectedArea = req.body.selectedArea;
    const description = req.body.description;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const leaderEmail = req.body.leaderEmail;
    const numOfRole = req.body.numOfRole;
    const projectData = req.body.projectData;

    try {
        const fieldId = await getFieldId(selectedField);
        const projectId = await insertProject(projectName, fieldId, selectedArea, description, startDate, endDate, leaderEmail);

        for (const data of projectData) {
            const { majorField, subField, numOfRole } = data;
            const majorFieldValue = majorField.split(': ')[1]; // Extract the value after ": "
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


async function getFieldId(selectedField) {
    return new Promise((resolve, reject) => {
        db.query('SELECT FieldId FROM Fields WHERE Field = ?', [selectedField], (err, result) => {
            if (err) {
                reject(err);
            } else {
                console.log(result);
                resolve(result[0].FieldId);
            }
        });
    });
}

async function getMajorFieldId(majorField) {
    return new Promise((resolve, reject) => {
        db.query('SELECT MajorFieldId FROM MajorField WHERE MajorField = ?', [majorField], (err, result) => {
            console.log(result);
            if (err) {
                reject(err);
            } else {
                resolve(result[0].MajorFieldId);
            }
        });
    });
}

async function getSubFieldId(subField) {
    return new Promise((resolve, reject) => {
        db.query('SELECT SubFieldId FROM SubField WHERE SubField = ?', [subField], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result[0].SubFieldId);
            }
        });
    });
}

async function insertProject(projectName, field, area, description, startDate, endDate, leaderEmail) {
    return new Promise((resolve, reject) => {
        const insertProjectQuery = 'INSERT INTO Projects (ProjectName, FieldId, Area, Description, StartDate, EndDate, Leader) VALUES (?, ?, ?, ?, ?, ?, ?)';
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
        const insertRecruitmentQuery = 'INSERT INTO Recruitment (MajorFieldId, SubFieldId, NumOfRole, ProjectId) VALUES (?, ?, ?, ?)';
        const recruitmentValues = [majorFieldId, subFieldId, numOfRole, projectId];
        db.query(insertRecruitmentQuery, recruitmentValues, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
