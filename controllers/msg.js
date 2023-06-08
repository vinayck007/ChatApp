const User = require('../models/user');
const Group = require('../models/group');
const File = require('../models/file');
const upload = require('./file');
const Sequelize = require('sequelize');
const Message = require('../models/msg');
const Membership = require('../models/membership')
const Invitation = require('../models/Invitation')
const { Op } = require('sequelize');

exports.getUserMsg = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const groupid = req.params.groupId
    let msg, files;
console.log(conversationId)
if(!conversationId) {
  msg = await Message.findAll({ where: { groupid } });
  files = await File.findAll({ where: { groupid }});
}
    else if (conversationId.includes('_')) {
      // Conversation ID contains underscore (user conversation ID)
      msg = await Message.findAll({
        where: {
          conversationId: {
            [Op.or]: [conversationId, conversationId.split('_').reverse().join('_')]
          }
        }
      });
      files = await File.findAll({
        where: {
          conversationId: {
            [Op.or]: [conversationId, conversationId.split('_').reverse().join('_')]
          }
        }
      });
    } 
    else {
      const groupId = parseInt(conversationId);
      msg = await Message.findAll({ where: { groupId } });
      files = await File.findAll({ where: { groupId }});
    }

    const msgs = {
      messages: msg,
      files: files
    };
    res.status(201).json({ success: true, data: msgs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

  

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
    const { name, creatorId } = req.body;

    // Create a new group
    const group = await Group.create({ name, creatorId });

    // Add the creator as a member of the group with isAdmin set to true
    const membership = await Membership.create({
      UserId: creatorId,
      groupId: group.id,
      isAdmin: true
    });

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.sendInvitation = async (req, res) => {
  let invitations = req.body;
  console.log(invitations)
  try { 
    if (!Array.isArray(invitations)) {
      // If invitations is not an array, create a new array with the single invitation object
      invitations = [invitations];
    }
    for (const invitation of invitations) {
      const creatorId = invitation.creatorId;
      const memberId = invitation.userId;
      const groupId = invitation.groupId;
      const groupName = invitation.groupName;
console.log(memberId)
      // Process the invitation for each item in the array

      const creator = await User.findByPk(creatorId);
      const creatorname = creator.name;

      if (memberId !== creatorId) {
        const invitation = await Invitation.create({
          groupId: groupId,
          userId: memberId,
          accepted: false
        });

        let invitationLink = `You have been invited to join the group '${groupName}'. <a href="/messages/groups/invite/${invitation.id}?status=accepted&groupId=${groupId}&userId=${memberId}">Click here to accept</a>`;

        const conversationId = `${creatorId}_${memberId}`;
        console.log(conversationId);
        await Message.create({
          text: invitationLink,
          username: creatorname,
          conversationId: conversationId,
        });
      }
    }

    console.log("Invitations sent successfully.");
    return true; // Move the return statement outside the loop
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

exports.isAdmin = async (req, res) => {
  const userId = req.params.userId;
  const groupId = req.params.groupId;
  const member = await Membership.findOne({
    where: {
      groupId: groupId,
      userId: userId
    }
  });

  if (member && member.isAdmin) {
    // The user is an admin
    res.status(200).json({ isAdmin: true });
  } else {
    // The user is not an admin
    res.status(200).json({ isAdmin: false });
  }
};

exports.uploadFile = async (req, res) => {

    // Access the uploaded file information
    const senderId = req.body.senderId;
    const filename = req.body.filename;
    const size = req.body.size;
    const path = req.body.path;
    // Perform any additional processing or validation here
console.log(req.body)
    // Store the file information in the database or file storage system
    const file = File.create({
      senderId,
      name: filename,
      size,
      path,
    });

    // Return a response indicating a successful file upload
    res.status(200).json({ message: 'File uploaded successfully', file});
  
};

exports.downloadFile = async (req, res) => {

}
