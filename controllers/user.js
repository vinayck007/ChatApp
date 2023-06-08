const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Invitation = require('../models/Invitation');

exports.signup = async (req, res) => {
  const { name, email, phone, password } = req.body;
  
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, phone, password: hashedPassword });
    res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

function generateAccessToken(id, name, isAdmin) {
  return jwt.sign({ userId: id, name: name, isAdmin: isAdmin }, process.env.TOKEN_SECRET);
}

  exports.login = (req, res) => {
    const { email, password } = req.body;
    console.log(email);
    User.findAll({ where : { email }}).then(user => {
        if(user.length > 0){
            bcrypt.compare(password, user[0].password, function(err, response) {
                if (err){
                console.log(err)
                return res.json({success: false, message: 'Something went wrong'})
                }
                if (response){
                    const username = user[0].name;
                    
                    User.update({ isOnline: true }, { where: { email: email } }); 
                    return res.status(200).json({success: true, token: generateAccessToken(user[0].id, username)});
                    
                // Send JWT
                } else {
                // response is OutgoingMessage object that server response http request
                return res.status(401).json({success: false, message: 'passwords do not match'});
                }
            });
        } else {
          return res.status(404).json({ message: 'User not found' });
        }
    })
}

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization
    console.log(token)
    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    const userId = decodedToken.userId;
    
    // Update user's isOnline status to false
    await User.update({ isOnline: false }, { where: { id: userId } });
    
    // Return success response
    return res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await User.findAll({ where: { isOnline: true } });
    res.status(200).json({ success: true, data: onlineUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users =await User.findAll();
    res.status(200).json({success: true, data: users})
  } catch (err) {
    res.status(401).json({success: false, error: err});
  }
}

exports.getGroupUsers = async (req, res) => {
  const { query, groupId } = req.query;

  try {
    // Parse the groupId as an integer
    const parsedGroupId = parseInt(groupId);

    // Retrieve the unaccepted invitations for the group
    const unacceptedInvitations = await Invitation.findAll({
      where: {
        GroupId: parsedGroupId,
        accepted: false
      }
    });

    // Extract the UserIds from the unaccepted invitations
    const userIds = unacceptedInvitations.map(invitation => invitation.UserId);
    console.log(userIds)
    // Retrieve the users based on the extracted UserIds
    const searchResults = await User.findAll({
      where: {
        id: {
          [Op.in]: userIds
        },
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ]
      }
    });

    res.json({ results: searchResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};




