import Account from "../models/Account.js";

export const getDashboard = async (req, res) => {
  const account = await Account.findById(req.session.user.id).lean();

  res.render("dashboard", {
    user: req.session.user,
    account,
  });
};
