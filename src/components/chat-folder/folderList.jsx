import { useMessageActionStore } from "@/stores/useMessageActionStore";
export const FolderList = ({ topic }) => {
  const { setCurrentTopic, setTopicIdTo } = useMessageActionStore();

  const handleSelectTopic = (id, topic) => {
    setTopicIdTo(id);
    setCurrentTopic(topic);
  };

  return (
    <>
      <div
        onClick={() => handleSelectTopic(topic.id, topic)}
        className="flex justify-start items-start gap-2 p-2 hover:bg-gray-500/20 transition"
      >
        <div>#</div>
        <div className="w-full">
          <div className="flex justify-between items-start">
            {" "}
            <p className="font-semibold text-sm max-w-20 truncate">
              {topic.name}
            </p>
            <div className="flex justify-start text-xs items-center">
              {" "}
              <div className="text-green-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                >
                  <g fill="none">
                    <path
                      fill="currentColor"
                      d="M4.565 12.407a.75.75 0 1 0-1.13.986zM7.143 16.5l-.565.493a.75.75 0 0 0 1.13 0zm8.422-8.507a.75.75 0 1 0-1.13-.986zm-5.059 3.514a.75.75 0 0 0 1.13.986zm-.834 3.236a.75.75 0 1 0-1.13-.986zm-6.237-1.35l3.143 3.6l1.13-.986l-3.143-3.6zm4.273 3.6l1.964-2.25l-1.13-.986l-1.964 2.25zm3.928-4.5l1.965-2.25l-1.13-.986l-1.965 2.25zm1.965-2.25l1.964-2.25l-1.13-.986l-1.964 2.25z"
                    />
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="m20 7.563l-4.286 4.5M11 16l.429.563l2.143-2.25"
                    />
                  </g>
                </svg>
              </div>
              {topic.lastMessageTime}
            </div>
          </div>
          <div className=" ">
            <div className="flex justify-between text-xs items-center">
              <div className="flex gap-2">
                <p className="max-w-37 truncate">
                  {" "}
                  <span className="text-blue-500 font-semibold">
                    {topic.lastSenderName}
                  </span>
                  : {topic.lastMessage}
                </p>
              </div>
              <div className="text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="m19.184 7.805l-2.965-2.967c-2.027-2.03-3.04-3.043-4.129-2.803s-1.581 1.587-2.568 4.28l-.668 1.823c-.263.718-.395 1.077-.632 1.355a2 2 0 0 1-.36.332c-.296.213-.664.314-1.4.517c-1.66.458-2.491.687-2.804 1.23a1.53 1.53 0 0 0-.204.773c.004.627.613 1.236 1.83 2.455L6.7 16.216l-4.476 4.48a.764.764 0 0 0 1.08 1.08l4.475-4.48l1.466 1.468c1.226 1.226 1.839 1.84 2.47 1.84c.265 0 .526-.068.757-.2c.548-.313.778-1.149 1.239-2.822c.202-.735.303-1.102.515-1.399q.14-.194.322-.352c.275-.238.632-.372 1.345-.64l1.844-.693c2.664-1 3.996-1.501 4.23-2.586c.235-1.086-.77-2.093-2.783-4.107"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
