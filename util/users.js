const users = [];

function userJoin(id, name) {
  const user = {id, name};

  users.push(user);

  return user
}

function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

module.exports = {
  userJoin,
  getCurrentUser
};