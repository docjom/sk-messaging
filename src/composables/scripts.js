export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  let messageDate;

  // Handle different timestamp formats
  if (timestamp && typeof timestamp.toDate === "function") {
    // Firestore Timestamp
    messageDate = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    // Already a Date object
    messageDate = timestamp;
  } else if (typeof timestamp === "number") {
    // Unix timestamp (milliseconds)
    messageDate = new Date(timestamp);
  } else if (timestamp && timestamp.seconds) {
    messageDate = new Date(timestamp.seconds * 1000);
  } else {
    // Fallback - try to create Date from whatever we have
    messageDate = new Date(timestamp);
  }

  // If we still don't have a valid date, return empty
  if (isNaN(messageDate.getTime())) return "";

  const now = new Date();
  const isToday = now.toDateString() === messageDate.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = yesterday.toDateString() === messageDate.toDateString();

  const isSameYear = now.getFullYear() === messageDate.getFullYear();

  if (isToday) {
    return messageDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (isYesterday) {
    return "Yesterday";
  }

  const diffInDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));

  if (diffInDays < 7) {
    return messageDate.toLocaleDateString("en-US", {
      weekday: "long",
    });
  }

  if (isSameYear) {
    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return messageDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatMessageWithLinks = (text, senderId, userId) => {
  if (!text) return "";

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const phoneRegex = /(\+?[\d\s\-()]{10,})/g;
  const mentionRegex = /(^|\s)(@[\w.-]+)/g;

  const isCurrentUser = senderId === userId;
  const linkClasses = isCurrentUser
    ? "text-white font-bold underline hover:text-gray-200 cursor-pointer"
    : "text-blue-400 underline hover:text-blue-300 cursor-pointer";

  let formattedText = text;

  formattedText = formattedText.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${linkClasses}">${url}</a>`;
  });

  formattedText = formattedText.replace(emailRegex, (email) => {
    return `<a href="mailto:${email}" class="${linkClasses}">${email}</a>`;
  });

  formattedText = formattedText.replace(phoneRegex, (phone) => {
    const cleanPhone = phone.replace(/\s+/g, "");
    if (cleanPhone.length >= 10) {
      return `<a href="tel:${cleanPhone}" class="${linkClasses}">${phone}</a>`;
    }
    return phone;
  });

  formattedText = formattedText.replace(
    mentionRegex,
    (match, space, handle) => {
      return `${space}<strong class="font-bold">${handle}</strong>`;
    }
  );

  return formattedText;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
