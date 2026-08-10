import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axiosInstance from "../../../configs/axiosInstance";
import { toast } from "react-toastify";
import MonetizationStatusConfirmModal from "./MonetizationStatusConfirmModal";

interface PricingPlan {
  id: number;
  name: string;
  productType: string;
  sellerAudience: string;
  price: number;
  durationDays?: number;
  boostCredits?: number;
  recommended?: boolean;
  pricingGroup?: string;
  categoryId?: number;
  isActive: boolean;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  listingLimit: number;
  boostCredits: number;
  recommended?: boolean;
  isActive: boolean;
}

type PendingAction =
  | { type: "disable-pricing"; plan: PricingPlan }
  | { type: "activate-pricing"; plan: PricingPlan }
  | { type: "activate-subscription"; plan: SubscriptionPlan };

const emptyForm = {
  name: "",
  productType: "featured",
  sellerAudience: "all",
  price: 0,
  durationDays: 7,
  boostCredits: 0,
  recommended: false,
  isActive: true,
};

const formatPriceInput = (value: number) => value.toLocaleString("vi-VN");

const parsePriceInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

export default function AdminMonetization() {
  const [activeTab, setActiveTab] = useState<"pricing" | "subscription">(
    "pricing",
  );
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingPricingPlanId, setEditingPricingPlanId] = useState<
    number | null
  >(null);
  const [isAddingPricingPlan, setIsAddingPricingPlan] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [subscriptionForm, setSubscriptionForm] = useState({
    name: "",
    price: 0,
    durationDays: 30,
    listingLimit: 10,
    boostCredits: 0,
    recommended: false,
    isActive: true,
  });
  const [editingSubscriptionPlanId, setEditingSubscriptionPlanId] = useState<
    number | null
  >(null);
  const [isAddingSubscriptionPlan, setIsAddingSubscriptionPlan] =
    useState(false);

  const load = () =>
    Promise.all([
      axiosInstance.get("/api/v1/monetization/admin/plans"),
      axiosInstance.get("/api/v1/monetization/admin/subscription-plans"),
    ]).then(([pricingResponse, subscriptionResponse]) => {
      setPlans(pricingResponse.data.data || []);
      setSubscriptionPlans(subscriptionResponse.data.data || []);
    });
  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isAddingPricingPlan) return;
    setIsAddingPricingPlan(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        durationDays:
          form.productType === "listing"
            ? undefined
            : Number(form.durationDays),
      };
      if (editingPricingPlanId) {
        await axiosInstance.patch(
          `/api/v1/monetization/admin/plans/${editingPricingPlanId}`,
          payload,
        );
      } else {
        await axiosInstance.post("/api/v1/monetization/admin/plans", payload);
      }
      toast.success(
        editingPricingPlanId ? "Đã cập nhật bảng giá" : "Đã thêm bảng giá",
      );
      setForm(emptyForm);
      setEditingPricingPlanId(null);
      await load();
    } finally {
      setIsAddingPricingPlan(false);
    }
  };

  const disable = async (id: number) => {
    await axiosInstance.delete(`/api/v1/monetization/admin/plans/${id}`);
    toast.success("Đã ngừng áp dụng bảng giá");
    await load();
  };

  const activate = async (plan: PricingPlan) => {
    const {
      name,
      productType,
      sellerAudience,
      price,
      durationDays,
      boostCredits,
      recommended,
      pricingGroup,
      categoryId,
    } = plan;
    await axiosInstance.patch(`/api/v1/monetization/admin/plans/${plan.id}`, {
      name,
      productType,
      sellerAudience,
      price,
      durationDays,
      boostCredits,
      recommended,
      pricingGroup,
      categoryId,
      isActive: true,
    });
    toast.success("Đã kích hoạt lại bảng giá");
    await load();
  };

  const activateSubscription = async (plan: SubscriptionPlan) => {
    const {
      name,
      price,
      durationDays,
      listingLimit,
      boostCredits,
      recommended,
    } = plan;
    await axiosInstance.patch(
      `/api/v1/monetization/admin/subscription-plans/${plan.id}`,
      {
        name,
        price,
        durationDays,
        listingLimit,
        boostCredits,
        recommended,
        isActive: true,
      },
    );
    toast.success("Đã kích hoạt lại gói tháng");
    await load();
  };

  const confirmStatusChange = async () => {
    if (!pendingAction) return;
    setIsUpdatingStatus(true);
    try {
      if (pendingAction.type === "disable-pricing") {
        await disable(pendingAction.plan.id);
      } else if (pendingAction.type === "activate-pricing") {
        await activate(pendingAction.plan);
      } else {
        await activateSubscription(pendingAction.plan);
      }
      setPendingAction(null);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const submitSubscription = async (event: FormEvent) => {
    event.preventDefault();
    if (isAddingSubscriptionPlan) return;
    setIsAddingSubscriptionPlan(true);
    try {
      if (editingSubscriptionPlanId) {
        await axiosInstance.patch(
          `/api/v1/monetization/admin/subscription-plans/${editingSubscriptionPlanId}`,
          subscriptionForm,
        );
      } else {
        await axiosInstance.post(
          "/api/v1/monetization/admin/subscription-plans",
          subscriptionForm,
        );
      }
      toast.success(
        editingSubscriptionPlanId
          ? "Đã cập nhật gói tháng"
          : "Đã thêm gói tháng",
      );
      setSubscriptionForm({
        name: "",
        price: 0,
        durationDays: 30,
        listingLimit: 10,
        boostCredits: 0,
        recommended: false,
        isActive: true,
      });
      setEditingSubscriptionPlanId(null);
      await load();
    } finally {
      setIsAddingSubscriptionPlan(false);
    }
  };

  const editPricingPlan = (plan: PricingPlan) => {
    setEditingPricingPlanId(plan.id);
    setForm({
      name: plan.name,
      productType: plan.productType,
      sellerAudience: plan.sellerAudience,
      price: plan.price,
      durationDays: plan.durationDays || 7,
      boostCredits: plan.boostCredits || 0,
      recommended: plan.recommended || false,
      isActive: plan.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editSubscriptionPlan = (plan: SubscriptionPlan) => {
    setEditingSubscriptionPlanId(plan.id);
    setSubscriptionForm({
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      listingLimit: plan.listingLimit,
      boostCredits: plan.boostCredits,
      recommended: plan.recommended || false,
      isActive: plan.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="px-5 py-6 md:px-8">
      <div className="space-y-7">
        <div className="flex w-fit gap-1 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("pricing")}
            className={`rounded-lg px-5 py-3 font-medium transition-colors ${
              activeTab === "pricing"
                ? "bg-white text-amber-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Bảng giá dịch vụ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("subscription")}
            className={`rounded-lg px-5 py-3 font-medium transition-colors ${
              activeTab === "subscription"
                ? "bg-white text-amber-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Gói tháng
          </button>
        </div>
        {activeTab === "pricing" && (
          <div className="space-y-7">
            <form
              onSubmit={submit}
              className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 grid-cols-3"
            >
              <label className="flex flex-col gap-2 md:col-span-1">
                <span className="text-[1.4rem] font-medium text-gray-600">
                  Tên gói
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Tên gói"
                  className="rounded-xl border border-gray-400 outline-none px-5 h-18"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[1.4rem] font-medium text-gray-600">
                  Loại dịch vụ
                </span>
                <select
                  value={form.productType}
                  onChange={(event) =>
                    setForm({ ...form, productType: event.target.value })
                  }
                  className="rounded-xl border border-gray-400 outline-none px-5 h-18"
                >
                  <option value="listing">Đăng tin</option>
                  <option value="featured">Nổi bật</option>
                  <option value="vip">VIP</option>
                  <option value="boost">Đẩy tin</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[1.4rem] font-medium text-gray-600">
                  Đối tượng
                </span>
                <select
                  value={form.sellerAudience}
                  onChange={(event) =>
                    setForm({ ...form, sellerAudience: event.target.value })
                  }
                  className="rounded-xl border border-gray-400 outline-none px-5 h-18"
                >
                  <option value="all">Tất cả</option>
                  <option value="individual">Cá nhân</option>
                  <option value="professional">Chuyên nghiệp</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[1.4rem] font-medium text-gray-600">
                  Giá
                </span>
                <div className="relative">
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    value={formatPriceInput(form.price)}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        price: parsePriceInput(event.target.value),
                      })
                    }
                    placeholder="Giá"
                    className="w-full rounded-xl border border-gray-400 px-5  pr-10 h-18 outline-none"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                    đ
                  </span>
                </div>
              </label>
              {form.productType !== "listing" && (
                <label className="flex flex-col gap-2">
                  <span className="text-[1.4rem] font-medium text-gray-600">
                    Số ngày
                  </span>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.durationDays}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        durationDays: Number(event.target.value),
                      })
                    }
                    placeholder="Số ngày"
                    className="h-18 rounded-xl border border-gray-400 px-5 outline-none"
                  />
                </label>
              )}
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={isAddingPricingPlan}
                  className="flex h-18 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAddingPricingPlan && (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {isAddingPricingPlan
                    ? "Đang lưu..."
                    : editingPricingPlanId
                      ? "Lưu thay đổi"
                      : "Thêm bảng giá"}
                </button>
                {editingPricingPlanId && (
                  <button
                    type="button"
                    disabled={isAddingPricingPlan}
                    onClick={() => {
                      setEditingPricingPlanId(null);
                      setForm(emptyForm);
                    }}
                    className="h-18 rounded-xl border border-gray-300 px-4 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
            <div className="overflow-hidden rounded-2xl border border-gray-400 bg-white">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left">Tên</th>
                    <th>Loại</th>
                    <th>Đối tượng</th>
                    <th>Giá</th>
                    <th>Thời hạn</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="border-t border-t-gray-400 ">
                      <td className="p-4 font-medium">{plan.name}</td>
                      <td className="text-center">{plan.productType}</td>
                      <td className="text-center">{plan.sellerAudience}</td>
                      <td className="text-center">
                        {plan.price.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="text-center">
                        {plan.durationDays ? `${plan.durationDays} ngày` : "—"}
                      </td>
                      <td className="text-center">
                        {plan.isActive ? "Đang áp dụng" : "Đã dừng"}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            type="button"
                            onClick={() => editPricingPlan(plan)}
                            className="font-medium text-blue-600 transition-colors hover:text-blue-700"
                          >
                            Cập nhật
                          </button>
                          {plan.isActive ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPendingAction({
                                  type: "disable-pricing",
                                  plan,
                                })
                              }
                              className="text-red-500 hover:text-red-700 transition-colors hover:cursor-pointer"
                            >
                              Ngừng
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setPendingAction({
                                  type: "activate-pricing",
                                  plan,
                                })
                              }
                              className="font-medium text-green-600 transition-colors hover:cursor-pointer hover:text-green-700"
                            >
                              Kích hoạt lại
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "subscription" && (
          <div className="space-y-7">
            <form
              onSubmit={submitSubscription}
              className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 grid-cols-3"
            >
              <label className="flex flex-col gap-2">
                <span className="text-[1.4rem] font-medium text-gray-600">
                  Tên gói tháng
                </span>
                <input
                  required
                  value={subscriptionForm.name}
                  onChange={(event) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      name: event.target.value,
                    })
                  }
                  placeholder="Tên gói tháng"
                  className="rounded-xl border border-gray-400 outline-none px-5 h-18"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[1.4rem] font-medium text-gray-600">
                  Giá
                </span>
                <div className="relative">
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    value={formatPriceInput(subscriptionForm.price)}
                    onChange={(event) =>
                      setSubscriptionForm({
                        ...subscriptionForm,
                        price: parsePriceInput(event.target.value),
                      })
                    }
                    placeholder="Giá"
                    className="w-full rounded-xl border border-gray-400 px-5 h-18 pr-10 outline-none"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                    đ
                  </span>
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[1.4rem] font-medium text-gray-600">
                  Số tin
                </span>
                <input
                  required
                  type="number"
                  min="1"
                  value={subscriptionForm.listingLimit}
                  onChange={(event) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      listingLimit: Number(event.target.value),
                    })
                  }
                  placeholder="Số tin"
                  className="rounded-xl border border-gray-400 outline-none px-5 h-18"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[1.4rem] font-medium text-gray-600">
                  Lượt đẩy
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  value={subscriptionForm.boostCredits}
                  onChange={(event) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      boostCredits: Number(event.target.value),
                    })
                  }
                  placeholder="Lượt đẩy"
                  className="rounded-xl border border-gray-400 outline-none px-5 h-18"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[1.4rem] font-medium text-gray-600">
                  Số ngày
                </span>
                <input
                  required
                  type="number"
                  min="1"
                  value={subscriptionForm.durationDays}
                  onChange={(event) =>
                    setSubscriptionForm({
                      ...subscriptionForm,
                      durationDays: Number(event.target.value),
                    })
                  }
                  placeholder="Số ngày"
                  className="rounded-xl border border-gray-400 outline-none px-5 h-18"
                />
              </label>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={isAddingSubscriptionPlan}
                  className="flex h-18 flex-1 items-center justify-center gap-2 rounded-xl bg-gray-800 px-5 text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAddingSubscriptionPlan && (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {isAddingSubscriptionPlan
                    ? "Đang lưu..."
                    : editingSubscriptionPlanId
                      ? "Lưu thay đổi"
                      : "Thêm gói tháng"}
                </button>
                {editingSubscriptionPlanId && (
                  <button
                    type="button"
                    disabled={isAddingSubscriptionPlan}
                    onClick={() => {
                      setEditingSubscriptionPlanId(null);
                      setSubscriptionForm({
                        name: "",
                        price: 0,
                        durationDays: 30,
                        listingLimit: 10,
                        boostCredits: 0,
                        recommended: false,
                        isActive: true,
                      });
                    }}
                    className="h-18 rounded-xl border border-gray-300 px-4 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
            <div className="grid gap-4 md:grid-cols-3">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5"
                >
                  <strong>{plan.name}</strong>
                  <p className="mt-2 text-xl text-amber-600">
                    {plan.price.toLocaleString("vi-VN")}đ
                  </p>
                  <p className="mt-2 text-gray-500">
                    {plan.listingLimit} tin · {plan.boostCredits} lượt đẩy ·{" "}
                    {plan.durationDays} ngày
                  </p>
                  <button
                    type="button"
                    onClick={() => editSubscriptionPlan(plan)}
                    className="mt-4 font-medium text-blue-600 transition-colors hover:text-blue-700"
                  >
                    Cập nhật
                  </button>
                  {!plan.isActive && (
                    <button
                      type="button"
                      onClick={() =>
                        setPendingAction({
                          type: "activate-subscription",
                          plan,
                        })
                      }
                      className="ml-4 mt-4 font-medium text-green-600 transition-colors hover:cursor-pointer hover:text-green-700"
                    >
                      Kích hoạt lại
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {pendingAction && (
        <MonetizationStatusConfirmModal
          isActivating={pendingAction.type !== "disable-pricing"}
          isProcessing={isUpdatingStatus}
          planName={pendingAction.plan.name}
          onClose={() => setPendingAction(null)}
          onConfirm={() => void confirmStatusChange()}
        />
      )}
    </section>
  );
}
