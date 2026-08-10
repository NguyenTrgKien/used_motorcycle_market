import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../../configs/axiosInstance";
import { useUser } from "../../../hooks/useUser";

interface Plan {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  listingLimit: number;
  boostCredits: number;
  recommended: boolean;
}

interface Subscription {
  expiresAt: string;
}

function SellerPlansSkeleton() {
  return (
    <div className="mx-auto my-8 max-w-7xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="h-8 w-80 max-w-full animate-pulse rounded-lg bg-gray-200" />
      <div className="mt-3 h-5 w-[32rem] max-w-full animate-pulse rounded bg-gray-100" />
      <div className="mt-7 grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-gray-200 p-6">
            <div className="h-7 w-2/5 animate-pulse rounded bg-gray-200" />
            <div className="mt-5 h-9 w-3/5 animate-pulse rounded bg-gray-200" />
            <div className="mt-5 h-5 w-full animate-pulse rounded bg-gray-100" />
            <div className="mt-3 h-5 w-4/5 animate-pulse rounded bg-gray-100" />
            <div className="mt-7 h-12 w-full animate-pulse rounded-xl bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SellerPlans() {
  const navigate = useNavigate();
  const { user, isLoading: isUserLoading } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const isProfessionalSeller = user?.sellerType === "professional";

  useEffect(() => {
    if (isUserLoading) return;
    if (!isProfessionalSeller) {
      setIsPlansLoading(false);
      return;
    }

    setIsPlansLoading(true);
    Promise.all([
      axiosInstance.get<{ data: Plan[] }>(
        "/api/v1/monetization/subscriptions/plans",
      ),
      axiosInstance.get<{ data: Subscription | null }>(
        "/api/v1/monetization/subscriptions/mine",
      ),
    ])
      .then(([plansResponse, subscriptionResponse]) => {
        const availablePlans = plansResponse.data.data || [];
        setPlans(availablePlans);
        setSelectedPlanId((currentPlanId) => {
          if (availablePlans.some((plan) => plan.id === currentPlanId)) {
            return currentPlanId;
          }
          return (
            availablePlans.find((plan) => plan.recommended)?.id ||
            availablePlans[0]?.id ||
            null
          );
        });
        setSubscription(subscriptionResponse.data.data);
      })
      .catch(() => {
        setPlans([]);
        setSelectedPlanId(null);
        setSubscription(null);
      })
      .finally(() => setIsPlansLoading(false));
  }, [isProfessionalSeller, isUserLoading]);

  if (isUserLoading || isPlansLoading) {
    return <SellerPlansSkeleton />;
  }

  if (!isProfessionalSeller) {
    return (
      <div className="mx-auto my-8 max-w-7xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-[2.2rem] font-medium text-gray-900">
          Gói dành cho người bán chuyên nghiệp
        </h1>
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-7">
          <h2 className="text-[1.8rem] font-semibold text-gray-900">
            Chỉ dành cho người bán chuyên
          </h2>
          <p className="mt-3 text-[1.4rem] leading-7 text-gray-600">
            Bạn cần đăng ký và được phê duyệt hồ sơ người bán chuyên trước khi
            xem hoặc mua các gói tháng.
          </p>
          <Link
            to="/setting/professional-seller"
            className="mt-6 inline-flex h-14 items-center rounded-xl bg-amber-500 px-6 font-medium text-white hover:bg-amber-600"
          >
            Đăng ký người bán chuyên
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto my-8 max-w-7xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div>
        <h1 className="text-[2.2rem] font-medium text-gray-900">
          Gói dành cho người bán chuyên nghiệp
        </h1>
        <p className="mt-2 text-[1.4rem] text-gray-500">
          Chọn gói phù hợp với nhu cầu đăng tin và quảng bá cửa hàng của bạn.
        </p>
      </div>

      {subscription && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-5 text-green-700">
          Gói hiện tại còn hiệu lực đến{" "}
          {new Date(subscription.expiresAt).toLocaleDateString("vi-VN")}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="mt-7 rounded-xl bg-gray-50 p-10 text-center text-gray-500">
          Hiện chưa có gói người bán nào đang hoạt động.
        </div>
      ) : (
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;

            return (
              <article
                key={plan.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => setSelectedPlanId(plan.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedPlanId(plan.id);
                  }
                }}
                className={`relative flex cursor-pointer flex-col rounded-2xl border p-6 transition ${
                  isSelected
                    ? "border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-200"
                    : "border-gray-200 bg-white hover:border-amber-300 hover:shadow-sm"
                }`}
              >
                {plan.recommended && (
                  <span className="absolute right-4 top-4 rounded-full bg-amber-500 px-3 py-1 text-[1.2rem] text-white">
                    Đề xuất
                  </span>
                )}
                <strong className="text-[2rem] text-gray-900">
                  {plan.name}
                </strong>
                <span className="mt-3 block text-[2.4rem] font-semibold text-amber-600">
                  {plan.price.toLocaleString("vi-VN")}đ
                </span>
                <span className="mt-1 text-[1.3rem] text-gray-500">
                  Sử dụng trong {plan.durationDays} ngày
                </span>
                <div className="my-6 space-y-3 text-[1.4rem] text-gray-600">
                  <p>{plan.listingLimit} lượt đăng tin</p>
                  <p>{plan.boostCredits} lượt đẩy tin</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    const params = new URLSearchParams({
                      amount: String(plan.price),
                      orderType: "subscription",
                      subscriptionPlanId: String(plan.id),
                      planName: plan.name,
                    });
                    navigate(`/payment?${params.toString()}`);
                  }}
                  className={`mt-auto h-16 w-full rounded-xl font-medium transition ${
                    isSelected
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-700"
                  }`}
                >
                  Thanh toán
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
