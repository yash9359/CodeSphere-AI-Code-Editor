import React from "react";

const AuthLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        px-6
        bg-gradient-to-br
        from-blue-50
        via-white
        to-violet-100
        dark:from-slate-950
        dark:via-blue-950
        dark:to-violet-950
      "
    >
      {children}
    </main>
  );
};

export default AuthLayout;