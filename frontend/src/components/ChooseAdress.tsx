import { motion } from "framer-motion";

function ChooseAddress() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      exit={{ opacity: 0 }}
      className="absolute space-y-6 lg:top-[calc(100%+1rem)] top-[calc(100%+.5rem)] left-0 w-full lg:w-[30rem] text-center h-auto p-5 bg-white border border-gray-300 lg:item-shadow transition-discrete duration-300 rounded-xl z-50"
    >
      <p className="font-medium">Khu vực</p>
      <select
        name="province"
        id="province"
        className="w-full h-[4rem] rounded-md border border-gray-300 outline-none px-6"
      >
        <option value="">Chọn tỉnh</option>
        <option value="">An Giang</option>
      </select>
      <select
        name="province"
        id="province"
        className="w-full h-[4rem] rounded-md border border-gray-300 outline-none px-6"
      >
        <option value="">Chọn huyện</option>
        <option value="">Tân Châu</option>
      </select>
      <button className="w-full h-[4rem] rounded-md bg-orange-400 hover:bg-orange-500 transition-colors duration-300 text-white">
        Áp dụng
      </button>
    </motion.div>
  );
}

export default ChooseAddress;
