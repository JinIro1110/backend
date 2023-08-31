const db = require('../config/database');

exports.acceptedMembers = async (req, res) => {
  const projectId = req.query.id; // Change this to match your query parameter name

  try {
    db.query(`
      SELECT * FROM Members
      WHERE ProjectId = ? AND Status = 'accepted';
    `, [projectId], (err, results) => {
      if (err) {
        console.error('Error fetching accepted members:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Send JSON response
      res.json({ acceptedMembers: results });
    });
  } catch (error) {
    console.error('Error fetching accepted members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

