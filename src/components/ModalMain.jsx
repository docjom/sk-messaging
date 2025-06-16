import { Icon } from "@iconify/react";
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  isSubmitDisabled,
  submitText,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="bg-gray-500/30 fixed top-0 left-0 z-50 w-screen h-screen text-white">
      <div className="flex h-screen justify-center items-center">
        <div className="p-4 border rounded-lg bg-gray-800">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="font-semibold text-lg w-80">{title}</h1>
              <div onClick={onClose} className="cursor-pointer">
                <Icon icon="solar:close-square-bold" width="24" height="24" />
              </div>
            </div>

            {/* Modal Content */}
            <div>{children}</div>

            {/* Submit Button */}
            {onSubmit && (
              <button
                onClick={onSubmit}
                className="w-full bg-green-500 flex font-semibold justify-center gap-2 items-center text-white px-4 py-2 rounded text-lg hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
                disabled={isSubmitDisabled}
              >
                {isLoading && (
                  <Icon
                    icon="line-md:loading-alt-loop"
                    width="24"
                    height="24"
                  />
                )}
                {submitText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
