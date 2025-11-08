const Logo = () => {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
          <span className="text-white text-2xl font-bold">X</span>
        </div>
        <div className="flex flex-col">
          <span className="text-primary text-3xl font-bold leading-none">Xsus</span>
          <span className="text-primary text-lg leading-none">Electronic</span>
        </div>
      </div>
    </div>
  );
};

export default Logo;
