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

export const formatMessageWithLinks = (text, senderId, userId) => {
  if (!text) return "";

  // Regular expressions for different patterns
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const phoneRegex = /(\+?[\d\s\-()]{10,})/g;

  // Determine styling based on sender
  const isCurrentUser = senderId === userId;
  const linkClasses = isCurrentUser
    ? "text-white font-bold underline hover:text-gray-200 cursor-pointer"
    : "text-blue-400 underline hover:text-blue-300 cursor-pointer";

  let formattedText = text;

  // Replace URLs with clickable links
  formattedText = formattedText.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" 
            class="${linkClasses}"
           >${url}</a>`;
  });

  // Replace emails with clickable mailto links
  formattedText = formattedText.replace(emailRegex, (email) => {
    return `<a href="mailto:${email}" 
            class="${linkClasses}"
            >${email}</a>`;
  });

  // Replace phone numbers with clickable tel links
  formattedText = formattedText.replace(phoneRegex, (phone) => {
    const cleanPhone = phone.replace(/\s+/g, "");
    if (cleanPhone.length >= 10) {
      return `<a href="tel:${cleanPhone}" 
              class="${linkClasses}"
             >${phone}</a>`;
    }
    return phone;
  });

  return formattedText;
};


 export const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };