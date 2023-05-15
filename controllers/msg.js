const User = require('../models/user');
const Group = require('../models/group')
const Sequelize = require('sequelize');
const Message = require('../models/msg');
const Membership = require('../models/membership')
const Invitation = require('../models/Invitation')
const { Op } = require('sequelize');

exports.getUserMsg = async (req, res) => {
try {
  const conversationId = req.params.conversationId;
  const msgs = await Message.findAll({
    where: {
      conversationId: {
        [Op.or]: [conversationId, conversationId.split('_').reverse().join('_')]
      }
    }
  })
  res.status(201).json({ success: true, data: msgs });
} catch (err) {
  console.error(err);
  res.status(500).json({ success: false, error: err.message });
}
}

async function checkIfInvitationAccepted(userId) {
  try {

    const invitationAccepted = await Invitation.findOne({
      where: {
        userId: userId,
        accepted: true
      }
    });
console.log(invitationAccepted)
    // Return true if the invitation was accepted, or false otherwise
    return !!invitationAccepted;
  } catch (error) {
    console.error(error);
    throw new Error('Error checking if invitation was accepted');
  }
}

exports.createGroup = async (req, res) => {
  try {
    const { name, creatorId, conversationIds, memberIds } = req.body;
    console.log(name)
    // Create a new group
    const group = await Group.create({ name, creatorId });
    
    // Find the users by their ids and add them to the group
    const users = await User.findAll({
      
      where: {
        id: {
          [Sequelize.Op.in]: memberIds
        }
      }
    });
    await Promise.all(users.map(async (user) => {
      const invitationAccepted = await checkIfInvitationAccepted(user.id);
      if (invitationAccepted) {
        await group.addUser(user);
      }
    }));
    const creator = await User.findByPk(creatorId);
const username = creator.name;
let invitationPromises = [];

memberIds.forEach(async (memberId) => {
  if (memberId !== creatorId) {
    const invitation = await Invitation.create({
      groupId: group.id,
      userId: memberId,
      accepted: false
    });

    const invitationLink = `You have been invited to join the group '${name}'. <a href="/messages/groups/invite/${invitation.id}?status=accepted&groupId=${group.id}&userId=${memberId}">Click here to accept</a>`;

    const conversationId = `${creatorId}_${memberId}`;
console.log(conversationId)
    invitationPromises.push(
      Message.create({
        text: invitationLink,
        username: username,
        conversationId: conversationId,
      })
    );
  }
});

await Membership.findOrCreate({
  where: { UserId: creatorId, groupId: group.id },
  defaults: { UserId: creatorId, groupId: group.id }
});

await Promise.all(invitationPromises);

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(userId)
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

exports.setInvitationStatus = async (req, res) => {
  try {
    const invitationId = req.params.id;
    const { status, userId, groupId } = req.query;
console.log(userId)
if (status === 'accepted') {
  await Invitation.update({ accepted: true, userId, groupId }, {
    where: { id: invitationId }
  });

  // Check if the membership already exists
  const created = await Membership.findOrCreate({
    where: { UserId: userId, groupId },
    defaults: { UserId: userId, groupId }
  });

  if (created) {
    res.status(200).json({ success: true, message: 'Invitation status updated successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Membership already exists' });
  }
} else {
  res.status(400).json({ success: false, message: 'Invalid status' });
}
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};