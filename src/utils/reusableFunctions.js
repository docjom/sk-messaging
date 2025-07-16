export const getDisplayName = (senderId, users) => {
  const sender = users.find((u) => u.id === senderId);
  return sender?.displayName || "Unknown User";
};
