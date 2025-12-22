import { nameProject } from "../lib/utils";

const Welcome = () => {
  return (
    <div className=" h-full flex flex-col items-center gap-5 p-5">
      <div className="text-lg lg:text-1xl 2xl:text-3xl">
        Chào mừng bạn đến với{" "}
        <span className="text-xl font-semibold lg:text-2xl 2xl:text-4xl tracking-normal">
          {nameProject}!
        </span>
      </div>
      <div className="text-xs lg:text-sm 2xl:text-lg">
        Hãy trò chuyện cùng người thân, bạn bè ngay nhé!
      </div>
    </div>
  );
};

export default Welcome;
