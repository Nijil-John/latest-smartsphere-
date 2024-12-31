const user = require("../models/userModel");
const isloggedin = async (req, res, next) => {
    const userData = await user.findById(req.session.user_id);
    console.log(userData);
    if (req.session && req.session.user_id) {
        if (userData.blocked == false) {
            return next();
        } else {
            req.session.destroy()
            res.render("userLogin", {
                categories: 'catData',
                message: "user is blocked because improper useage, please contact customer care.",
            });
        }
    } else {
        return res.redirect("/login");
    }
};
module.exports = isloggedin;
