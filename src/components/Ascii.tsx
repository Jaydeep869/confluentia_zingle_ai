import React from "react";

const Ascii = () => {
  return (
    <pre
      className="text-xs sm:text-sm md:text-base leading-tight font-mono 
                 whitespace-pre text-transparent bg-clip-text 
                 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 
                 drop-shadow-[0_0_8px_rgba(168,85,247,0.7)] overflow-x-auto"
    >
{`██████╗  █████╗ ████████╗ █████╗ ██████╗  ██████╗ ████████╗██╗██╗  ██╗
██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██║╚██╗██╔╝
██║  ██║███████║   ██║   ███████║██████╔╝██║   ██║   ██║   ██║ ╚███╔╝ 
██║  ██║██╔══██║   ██║   ██╔══██║██╔══██╗██║   ██║   ██║   ██║ ██╔██╗ 
██████╔╝██║  ██║   ██║   ██║  ██║██████╔╝╚██████╔╝   ██║   ██║██╔╝ ██╗
╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═════╝  ╚═════╝    ╚═╝   ╚═╝╚═╝  ╚═╝`}
    </pre>
  );
};

export default Ascii;
