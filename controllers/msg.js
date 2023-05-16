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
    const { name, creatorId, memberIds } = req.body;
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

    const [membership, created] = await Membership.findOrCreate({
      where: { UserId: creatorId, groupId: group.id },
      defaults: { UserId: creatorId, groupId: group.id }
    });
    
    if (created) {
      membership.isAdmin = true;
      await membership.save();
    } else {
      membership.isAdmin = true;
      await membership.update();
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
  }

  exports.sendInvitation = async (req, res) => {
  const creatorId = req.body.creatorId;
  const userId = req.body.userId;
  const groupId = req.body.groupId;
  const groupName = req.body.name;
    const memberIds = Array.isArray(userId) ? userId : [userId];
    const creator = await User.findByPk(creatorId);
    
    const creatorname = creator.name; // Assuming the logged-in user's username is available in `req.user.username`
  let invitationPromises = [];
  try {
      memberIds.forEach(async (memberId) => {
        if (memberId !== creatorId) {
          const invitation = await Invitation.create({
            groupId: groupId,
            userId: memberId,
            accepted: false
          });
        
          let invitationLink;
          if (groupName) {
            invitationLink = `You have been invited to join the group '${groupName}'. <a href="/messages/groups/invite/${invitation.id}?status=accepted&groupId=${groupId}&userId=${userId}">Click here to accept</a>`;
          } else {
            const group = await Group.findByPk(groupId);
            const groupName = group.name;
            invitationLink = `You have been invited to join the group '${groupName}'. <a href="/messages/groups/invite/${invitation.id}?status=accepted&groupId=${groupId}&userId=${userId}">Click here to accept</a>`;
          }

    const conversationId = `${creatorId}_${userId}`;
    console.log(conversationId);
    invitationPromises.push(
      Message.create({
        text: invitationLink,
        username: creatorname,
        conversationId: conversationId,
      })
    );
        

    await Promise.all(invitationPromises);

    return true;
        }
  })
  } catch (err) {
    console.error(err);
    throw err;
  }
};

exports.getGroups = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(userId)
    const memberships = await Membership.findAll({
      where: { userId },
      attributes: ['groupId', 'isAdmin']
    });

    const groupIds = memberships.map(membership => membership.groupId);

    const groups = await Group.findAll({
      where: { id: groupIds }
    });

    const groupData = groups.map(group => ({
      id: group.id,
      name: group.name,
      isAdmin: memberships.find(membership => membership.groupId === group.id)?.isAdmin || false
    }));
console.log(groupData)
    res.status(200).json({ success: true, data: groupData });
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

exports.removeUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    const groupId = req.body.groupId;

    // Find the membership record to be deleted
    const membership = await Membership.findOne({
      where: {
        userId: userId,
        groupId: groupId
      }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Membership record not found' });
    }

    // Delete the membership record
    await membership.destroy();

    return res.status(200).json({ message: 'User removed from the group successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.makeAdmin = async (req, res) => {
  const { userId, groupId } = req.body;
console.log(userId)
  try {
    // Find the user and group
    const user = await User.findByPk(userId);
    const group = await Group.findByPk(groupId);

    // Check if the user and group exist
    if (!user || !group) {
      return res.status(404).json({ message: 'User or group not found' });
    }

    // Update the user's membership with the isAdmin flag set to true
    await Membership.update(
      { isAdmin: true },
      { where: { userId, groupId } }
    );

    res.status(200).json({ message: 'User is now an admin' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}