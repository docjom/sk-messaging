import React from "react";
import { Icon } from "@iconify/react";

export const EmojiSet = () => {
  return (
    <div className="flex gap-2 border p-1 rounded-full bg-transparent backdrop-blur-sm ">
      <div>
        <picture onClick={() => console.log("Emoji clicked: heart")}>
          <source
            srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp"
            type="image/webp"
          />
          <img
            src="https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif"
            alt="❤"
            width="32"
            height="32"
          />
        </picture>
      </div>
      <div>
        <picture>
          <source
            srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f620/512.webp"
            type="image/webp"
          />
          <img
            src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f620/512.gif"
            alt="😠"
            width="32"
            height="32"
          />
        </picture>
      </div>
      <div>
        <picture>
          <source
            srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.webp"
            type="image/webp"
          />
          <img
            src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.gif"
            alt="😭"
            width="32"
            height="32"
          />
        </picture>
      </div>
      <div>
        <picture>
          <source
            srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.webp"
            type="image/webp"
          />
          <img
            src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.gif"
            alt="🙏"
            width="32"
            height="32"
          />
        </picture>
      </div>
      <div>
        <picture>
          <source
            srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.webp"
            type="image/webp"
          />
          <img
            src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif"
            alt="😀"
            width="32"
            height="32"
          />
        </picture>
      </div>
      <div className="flex items-center text-gray-500 pr-2 justify-center ">
        <Icon icon="solar:widget-add-bold-duotone" width="16" height="16" />
      </div>
    </div>
  );
};
