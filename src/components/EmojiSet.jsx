import React from "react";

const emojis = [
  {
    alt: "❤",
    srcSet: "2764_fe0f",
    label: "heart",
  },
  {
    alt: "😀",
    srcSet: "1f600",
    label: "grinning",
  },
  {
    alt: "🙏",
    srcSet: "1f64f",
    label: "pray",
  },
  {
    alt: "😭",
    srcSet: "1f62d",
    label: "crying",
  },
  {
    alt: "😠",
    srcSet: "1f620",
    label: "angry",
  },
];

const HandleEmojiClick = (emoji, messageId, userId) => {
  console.log(`Emoji clicked: ${emoji.label}`);
  console.log(`Message ID: ${messageId}`);
  console.log(`User ID: ${userId}`);
};

export const EmojiSet = ({ messageId, userId }) => {
  return (
    <div className="flex gap-2 border p-1 rounded-full bg-transparent backdrop-blur-sm">
      {emojis.map((emoji, index) => (
        <div key={index}>
          <picture
            onClick={() => HandleEmojiClick(emoji, messageId, userId)}
            className="cursor-pointer"
          >
            <source
              srcSet={`https://fonts.gstatic.com/s/e/notoemoji/latest/${emoji.srcSet}/512.webp`}
              type="image/webp"
            />
            <img
              src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${emoji.srcSet}/512.gif`}
              alt={emoji.alt}
              width="32"
              height="32"
            />
          </picture>
        </div>
      ))}
    </div>
  );
};
