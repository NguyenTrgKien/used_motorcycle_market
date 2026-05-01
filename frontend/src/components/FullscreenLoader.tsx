function FullscreenLoader() {
  return (
    <div className="w-full h-[100vh] flex flex-col gap-5 items-center justify-center">
      <div className="w-[4rem] h-[4rem] rounded-full border-t-2 border-b-1 border-amber-600 animate-spin"></div>
      <span className="text-[1.4rem] text-gray-500">Loading...</span>
    </div>
  );
}

export default FullscreenLoader;
