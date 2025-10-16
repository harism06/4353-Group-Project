const users = require("../data/users");
const { userProfileSchema } = require("../validations/userSchema");

exports.getUser = (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { password, ...userWithoutPassword } = user;
  res.status(200).json(userWithoutPassword);
};

exports.updateUser = (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  const result = userProfileSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: result.error.errors,
    });
  }

  users[userIndex] = {
    ...users[userIndex],
    ...result.data,
  };

  const { password, ...updatedUser } = users[userIndex];
  res.status(200).json({
    message: "Profile updated successfully",
    user: updatedUser,
  });
};
