const db = require('../config/database');
const jwt = require('jsonwebtoken');

exports.recruitPage = async (req, res) => {
  const projectId = req.query.id;

  try {
    const query = `
      SELECT sf.SubField, rs.NumOfRole
      FROM Recruitment AS rs
      JOIN SubField AS sf ON rs.SubFieldId = sf.SubFieldId
      WHERE rs.ProjectId = ?;
    `;

    db.query(query, [projectId], (err, results) => {
      if (err) {
        console.error('Error fetching recruitment page data:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const recruitmentInfo = results.map(item => ({
        SubField: item.SubField,
        NumOfRole: item.NumOfRole,
      }));

      // Send JSON response
      res.json({
        recruitmentInfo,
      });
    });
  } catch (error) {
    console.error('Error fetching recruitment page data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.apply = async (req, res) => {
  try {
    const token = req.cookies.jwt; // 쿠키에서 토큰을 가져옵니다.

    // 토큰 검증 후 이메일 추출
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decodedToken.email;

    const { subfield, projectId } = req.body;

    // 이미 지원한 프로젝트인지 확인
    const checkApplicationQuery = 'SELECT * FROM Members WHERE MemberEmail = ? AND ProjectId = ?';
    const checkApplicationResult = await db.query(checkApplicationQuery, [userEmail, projectId]);

    if (checkApplicationResult.length > 0) {
      return res.status(400).json({ message: 'You have already applied to this project.' });
    }

    // 지원 정보 저장
    const applyQuery = 'INSERT INTO Members (Subfield, MemberEmail, ProjectId) VALUES (?, ?, ?)';
    const applyResult = await db.query(applyQuery, [subfield, userEmail, projectId]);

    if (applyResult.affectedRows > 0) {
      const applicationMessage = checkApplicationResult.length > 0
        ? 'You have already applied to this project.'
        : 'Application successful.';

      return res.status(200).json({ message: applicationMessage });
    } else {
      return res.status(500).json({ message: 'Failed to apply.' });
    }
  } catch (error) {
    console.error('Error applying:', error);
    return res.status(500).json({ message: 'An error occurred while applying.' });
  }
};

exports.cancelApplication = async (req, res) => {
  try {
    const token = req.cookies.jwt; // 쿠키에서 토큰을 가져옵니다.

    // 토큰 검증 후 이메일 추출
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decodedToken.email;

    const projectId = req.params.projectId; // 취소할 프로젝트의 ID

    // 지원 정보 삭제
    const cancelApplicationQuery = 'DELETE FROM Members WHERE MemberEmail = ? AND ProjectId = ?';
    const cancelApplicationResult = await db.query(cancelApplicationQuery, [userEmail, projectId]);

    if (cancelApplicationResult.affectedRows > 0) {
      return res.status(200).json({ message: 'Application canceled successfully.' });
    } else {
      return res.status(400).json({ message: 'Application cancel failed.' });
    }
  } catch (error) {
    console.error('Error canceling application:', error);
    return res.status(500).json({ message: 'An error occurred while canceling application.' });
  }
};