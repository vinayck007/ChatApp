const User = require('../models/user');
const Group = require('../models/group')
const Sequelize = require('sequelize');
const Message = require('../models/msg');
const Membership = require('../models/membership')

exports.createGroup = async (req, res) => {
  try {
    const { name, members, creatorId } = req.body;
    console.log(creatorId)
    // Create a new group
    const group = await Group.create({ name, creatorId });

    // Find the users by their ids and add them to the group
    const users = await User.findAll({
      
      where: {
        name: {
          [Sequelize.Op.in]: members
        }
      }
    });
    await group.addUsers(users);

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const memberships = await Membership.findAll({
      where: { userId },
      attributes: ['groupId']
    });

    const groupIds = memberships.map(membership => membership.groupId);

    const groups = await Group.findAll({
      where: { id: groupIds },
      attributes: ['id', 'name']
    });

    res.status(200).json({ success: true, data: groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

exports.getUsersInGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId);
    const users = await group.getUsers();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

exports.getGroupMessages = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    const messages = await Message.findAll({ where: { groupId } });
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};