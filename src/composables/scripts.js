export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const messageDate = timestamp.toDate();
  const now = new Date();
  const diffInMs = now - messageDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // If less than 1 minute ago
  if (diffInMinutes < 1) {
    return "Just now";
  }

  // If less than 1 hour ago
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  // If less than 24 hours ago
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  // If less than 7 days ago
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // If same year
  if (messageDate.getFullYear() === now.getFullYear()) {
    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  // Different year
  return messageDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
