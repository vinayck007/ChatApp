const users = [];

function userJoin(id, name) {
  const user = {id, name};

  users.push(user);

  return user
}

function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

function userLeft(id) {
  const index = users.findIndex(user => user.id === id);

  if(index !== -1) {
    return users.splice(index, 1)[0];
  }
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeft
};