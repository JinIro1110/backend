// recruitmentController.js

const db = require('../config/database');

exports.recruitPage = async (req, res) => {
  const projectId = req.query.id;

  try {
    // SubField와 해당 SubField의 NumOfRole을 가져오는 쿼리
    const query = `
      SELECT sf.SubField, rs.NumOfRole
      FROM Recruitment AS rs
      JOIN SubField AS sf ON rs.SubFieldId = sf.SubFieldId
      WHERE rs.ProjectId = ?;
    `;

    // 데이터 조회
    db.query(query, [projectId], (err, results) => {
      if (err) {
        console.error('Error fetching recruitment page data:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // 가공된 모집현황 데이터 배열 생성
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
