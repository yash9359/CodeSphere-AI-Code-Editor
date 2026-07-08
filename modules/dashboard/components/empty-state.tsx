import Image from "next/image";

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Image
        src="/empty-state.svg"
        alt="No projects"
        width={220}
        height={220}
        className="mb-6 select-none transition-transform duration-300 hover:scale-105 "
        priority
      />

      <h2 className="text-2xl font-bold text-foreground">
        No Playgrounds Yet
      </h2>

      <p className="mt-1 max-w-md text-muted-foreground">
        Looks a little empty here. Create your first playground or import
        a GitHub repository to start building.
      </p>
    </div>
  );
};

export default EmptyState;