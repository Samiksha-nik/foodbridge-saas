const { requireRole } = require("./authMiddleware");

/**
 * Thin wrapper so routes can import role-based middleware separately.
 * Usage: const { requireRole } = require('../middleware/roleMiddleware');
 */
module.exports = {
  requireRole,
};

