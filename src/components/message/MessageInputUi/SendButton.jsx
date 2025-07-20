export const SendButton = ({
  handleSendMessage,
  message,
  messagesLoading,
  isMessagesSending,
  editMessage,
  pastedImage,
}) => {
  return (
    <>
      <button
        onClick={handleSendMessage}
        className={`p-2 rounded-full ${
          !message && !pastedImage
            ? "bg-gray-400 dark:bg-gray-700 text-white cursor-not-allowed"
            : editMessage
            ? "bg-green-500 text-white"
            : "bg-blue-500 text-white"
        }`}
        disabled={
          (!message && !pastedImage) ||
          messagesLoading ||
          isMessagesSending
        }
      >
        {editMessage ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10m-5.97-3.03a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47l2.235-2.235L14.97 8.97a.75.75 0 0 1 1.06 0"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M4.4 19.425q-.5.2-.95-.088T3 18.5V14l8-2l-8-2V5.5q0-.55.45-.837t.95-.088l15.4 6.5q.625.275.625.925t-.625.925z"
            />
          </svg>
        )}
      </button>
    </>
  );
};
