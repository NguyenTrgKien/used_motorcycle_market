import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import axiosInstance from "../../../../configs/axiosInstance";
import type { BoostCampaignInfo, ListingPost } from "../post.types";

interface Offer {
  id: number;
  name: string;
  productType: "listing" | "featured" | "vip" | "boost";
  price: number;
  durationDays?: number;
  recommended: boolean;
}

interface Props {
  postId: number;
  compact?: boolean;
  status?: string;
  boostOnly?: boolean;
  post?: ListingPost;
}

export default function MonetizationOffers({
  postId,
  compact = false,
  status,
  boostOnly = false,
  post,
}: Props) {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [offersError, setOffersError] = useState(false);
  const [selected, setSelected] = useState<Offer | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [
    showSubscriptionBoostConfirmation,
    setShowSubscriptionBoostConfirmation,
  ] = useState(false);
  const [isUsingSubscriptionBoost, setIsUsingSubscriptionBoost] =
    useState(false);
  const [fetchedPost, setFetchedPost] = useState<ListingPost | null>(null);
  const [activeCampaign, setActiveCampaign] =
    useState<BoostCampaignInfo | null>(null);
  const expectedStartDate = new Date().toLocaleDateString("vi-VN");

  const loadActiveCampaign = () => {
    axiosInstance
      .get<{ data: BoostCampaignInfo[] }>(
        `/api/v1/monetization/boost-campaigns/mine?postId=${postId}`,
      )
      .then((response) => {
        const active =
          (response.data.data || []).find(
            (campaign) => campaign.status === "active",
          ) || null;
        setActiveCampaign(active);
        if (active) {
          setSelected(null);
          setShowConfirmation(false);
        }
      })
      .catch(() => setActiveCampaign(null));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingOffers(true);
    setOffersError(false);
    axiosInstance
      .get(`/api/v1/monetization/plans?postId=${postId}`)
      .then((response) => {
        setOffers(
          (response.data.data || []).filter(
            (offer: Offer) =>
              offer.productType !== "listing" &&
              (!boostOnly || offer.productType === "boost") &&
              (offer.productType !== "boost" || status === "active"),
          ),
        );
      })
      .catch(() => {
        setOffers([]);
        setOffersError(true);
      })
      .finally(() => setIsLoadingOffers(false));
    axiosInstance
      .get("/api/v1/monetization/subscriptions/mine")
      .then((response) => setHasSubscription(Boolean(response.data.data)))
      .catch(() => setHasSubscription(false));
  }, [boostOnly, postId, status]);

  useEffect(() => {
    if (post) return;
    axiosInstance
      .get<{ data: ListingPost[] }>("/api/v1/posts/my")
      .then((response) => {
        setFetchedPost(
          (response.data.data || []).find((item) => item.id === postId) || null,
        );
      })
      .catch(() => setFetchedPost(null));
  }, [post, postId]);

  useEffect(() => {
    loadActiveCampaign();
    const socket = io("http://localhost:8080", { withCredentials: true });
    socket.on(
      "notification.created",
      (notification: { type: string; referenceId: number }) => {
        if (
          notification.type === "bank_transfer_confirmed" &&
          notification.referenceId === postId
        )
          loadActiveCampaign();
      },
    );
    return () => {
      socket.disconnect();
    };
  }, [postId]);

  const useSubscriptionBoost = async () => {
    try {
      setIsUsingSubscriptionBoost(true);
      await axiosInstance.post(
        `/api/v1/monetization/subscriptions/boost/${postId}`,
      );
      toast.success("Đã đẩy tin");
      setShowSubscriptionBoostConfirmation(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể dùng lượt đẩy");
    } finally {
      setIsUsingSubscriptionBoost(false);
    }
  };

  if (isLoadingOffers) {
    return <p className="mt-6 text-gray-500">Đang tải các gói dịch vụ...</p>;
  }

  if (!offers.length) {
    return (
      <p className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 text-gray-600">
        {offersError
          ? "Không thể tải các gói dịch vụ. Vui lòng thử lại."
          : "Hiện chưa có gói dịch vụ phù hợp cho tin đăng này."}
      </p>
    );
  }

  return (
    <>
      <div className={compact ? "flex flex-wrap gap-2" : "mt-6"}>
        {hasSubscription && status === "active" && (
          <button
            type="button"
            onClick={() => setShowSubscriptionBoostConfirmation(true)}
            className="rounded-xl border border-green-500 px-4 py-3 text-green-700 mb-5"
          >
            Dùng lượt đẩy trong gói
          </button>
        )}
        <div className="w-full rounded-xl border border-gray-300 p-5">
          <h3>{boostOnly ? "Đẩy tin thường" : "Các gói quảng bá"}</h3>
          <span className="mt-1 block text-[1.4rem] text-gray-500">
            {boostOnly
              ? "Đẩy tin 1 lần mỗi ngày, lặp lại sau 24 giờ"
              : "Tăng mức độ ưu tiên và khả năng tiếp cận của tin đăng"}
          </span>
          {activeCampaign && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
              <p className="font-medium">Tin đang có gói đẩy tin hoạt động</p>
              <p className="mt-1 text-[1.3rem]">
                Đã đẩy {activeCampaign.boostsCompleted}/
                {activeCampaign.totalBoosts} lượt
                {activeCampaign.nextBoostAt
                  ? ` • Lần tiếp theo ${new Date(activeCampaign.nextBoostAt).toLocaleString("vi-VN")}`
                  : ""}
              </p>
            </div>
          )}
          <div className="mt-8 flex items-center gap-6 border-t border-t-gray-300 pt-8">
            {offers.map((offer) => (
              <button
                key={offer.id}
                type="button"
                disabled={Boolean(activeCampaign)}
                onClick={() => {
                  setSelected(offer);
                  setShowConfirmation(false);
                }}
                className={`relative rounded-2xl border p-5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${selected?.id === offer.id ? "border-amber-500" : "border-gray-200"} ${compact ? "px-4 py-3" : ""}`}
              >
                {offer.recommended && !compact && (
                  <span className="absolute -top-3 right-0 rounded-full bg-amber-500 px-3 py-1 text-[1.2rem] text-white">
                    Đề xuất
                  </span>
                )}
                <span className="block font-medium text-gray-900">
                  {offer.name}
                </span>
                {!compact && offer.durationDays && (
                  <span className="mt-1 block text-[1.4rem] text-gray-500">
                    Hiệu lực {offer.durationDays} ngày
                  </span>
                )}
                <span className="mt-2 block pr-8 font-semibold text-amber-600">
                  {offer.price.toLocaleString("vi-VN")}đ
                </span>
                {selected?.id === offer.id && (
                  <span className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                    <FontAwesomeIcon icon={faCheck} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      {selected && !showConfirmation && !activeCampaign && (
        <div className="fixed bottom-0 left-0 right-0 z-[900] border-t border-gray-200 bg-white px-8 py-5 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
          <div className="mx-auto flex max-w-[100rem] items-center justify-between gap-6">
            <div>
              <p className="font-medium text-gray-900">{selected.name}</p>
              <p className="text-[1.4rem] text-gray-500">
                {selected.price.toLocaleString("vi-VN")}đ
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmation(true)}
              className="h-[4.8rem] rounded-xl bg-amber-500 px-10 font-medium text-white hover:bg-amber-600"
            >
              Thanh toán
            </button>
          </div>
        </div>
      )}
      {selected && showConfirmation && !activeCampaign && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-6">
          <div className="relative w-full max-w-[50rem] rounded-2xl bg-white p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <h2 className="text-[2.2rem] font-semibold text-gray-900">
              Xác nhận thanh toán
            </h2>
            {(post || fetchedPost) && (
              <div className="mt-6 flex items-center gap-4 rounded-xl border border-gray-200 p-4">
                <div className="h-[8rem] w-[11rem] shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {(post || fetchedPost)?.post_images?.[0]?.imageUrl && (
                    <img
                      src={(post || fetchedPost)!.post_images![0].imageUrl}
                      alt={(post || fetchedPost)!.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">
                    {(post || fetchedPost)!.title}
                  </p>
                  <p className="mt-1 text-amber-600">
                    {Number((post || fetchedPost)!.price).toLocaleString(
                      "vi-VN",
                    )}
                    đ
                  </p>
                </div>
              </div>
            )}
            <span className="block mt-5 border-t-2 border-dashed border-t-gray-300"></span>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-amber-50 p-5">
              <div>
                <p className="font-medium text-gray-900">{selected.name}</p>
                <ul className="mt-1 text-[1.4rem] text-gray-500">
                  <li>- Dự kiến bắt đầu ngày {expectedStartDate}</li>
                  <li>- Tin được đẩy lên trang đầu sau khi thanh toán</li>
                </ul>
                {selected.durationDays && (
                  <p className="mt-1 text-[1.4rem] text-gray-500">
                    Hiệu lực {selected.durationDays} ngày
                  </p>
                )}
              </div>
              <p className="font-semibold text-amber-600">
                {selected.price.toLocaleString("vi-VN")}đ
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams({
                  postId: String(postId),
                  amount: String(selected.price),
                  orderType: selected.productType,
                  pricingPlanId: String(selected.id),
                  planName: selected.name,
                  durationDays: String(selected.durationDays || 1),
                  expectedStartDate,
                });
                navigate(`/payment?${params.toString()}`);
              }}
              className="mt-6 h-[5rem] w-full rounded-xl bg-amber-500 font-medium text-white hover:bg-amber-600"
            >
              Thanh toán
            </button>
          </div>
        </div>
      )}
      {showSubscriptionBoostConfirmation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="subscription-boost-confirmation-title"
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-6"
        >
          <div className="relative w-full max-w-[48rem] rounded-2xl bg-white p-8 shadow-2xl">
            <button
              type="button"
              aria-label="Đóng"
              disabled={isUsingSubscriptionBoost}
              onClick={() => setShowSubscriptionBoostConfirmation(false)}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <h2
              id="subscription-boost-confirmation-title"
              className="pr-12 text-[2.2rem] font-semibold text-gray-900"
            >
              Xác nhận dùng lượt đẩy
            </h2>
            <p className="mt-2 text-[1.4rem] leading-6 text-gray-500">
              Một lượt đẩy trong gói người bán sẽ được sử dụng và không thể hoàn
              lại sau khi xác nhận.
            </p>
            {(post || fetchedPost) && (
              <div className="mt-6 flex items-center gap-4 rounded-xl border border-gray-200 p-4">
                <div className="h-[8rem] w-[11rem] shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {(post || fetchedPost)?.post_images?.[0]?.imageUrl && (
                    <img
                      src={(post || fetchedPost)!.post_images![0].imageUrl}
                      alt={(post || fetchedPost)!.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">
                    {(post || fetchedPost)!.title}
                  </p>
                  <p className="mt-1 text-[1.3rem] text-gray-500">
                    Tin sẽ được đưa lên đầu danh sách ngay sau khi xác nhận.
                  </p>
                </div>
              </div>
            )}
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                disabled={isUsingSubscriptionBoost}
                onClick={() => setShowSubscriptionBoostConfirmation(false)}
                className="h-[4.8rem] flex-1 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isUsingSubscriptionBoost}
                // eslint-disable-next-line react-hooks/rules-of-hooks
                onClick={() => void useSubscriptionBoost()}
                className="h-[4.8rem] flex-1 rounded-xl bg-green-600 font-medium text-white hover:bg-green-700 disabled:bg-gray-300"
              >
                {isUsingSubscriptionBoost
                  ? "Đang xử lý..."
                  : "Xác nhận đẩy tin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
