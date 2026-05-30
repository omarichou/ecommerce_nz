const YALIDINE_API_ROUTE = "/api/client/yalidin";

export const DEFAULT_MERCHANT_WILAYA_ID = 23;
export const DEFAULT_MERCHANT_WILAYA_NAME = "Annaba";

const normalizeValue = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const fetchYalidineResource = async (resource, params = {}) => {
  const searchParams = new URLSearchParams();
  searchParams.set("resource", resource);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  const response = await fetch(`${YALIDINE_API_ROUTE}?${searchParams.toString()}`);
  if (!response.ok) {
    return resource === "fees" ? {} : [];
  }
  try {
    return await response.json();
  } catch {
    return resource === "fees" ? {} : [];
  }
};

export const findWilayaByName = (wilayas, wilayaName) =>
  wilayas.find((wilaya) => normalizeValue(wilaya.name) === normalizeValue(wilayaName));

export const findCommuneByName = (communes, communeName) =>
  communes.find((commune) => normalizeValue(commune.name) === normalizeValue(communeName));

export const getDeliveryFeeFromYalidineFees = ({
  feesData,
  deliveryType,
  communeName,
  communeId,
}) => {
  if (!feesData?.per_commune) return 0;
  const feeType = deliveryType === "homeDelivery" ? "express_home" : "express_desk";
  const communeEntries = Object.values(feesData.per_commune);
  const selectedCommune =
    communeEntries.find((entry) => `${entry.commune_id}` === `${communeId}`) ||
    communeEntries.find(
      (entry) => normalizeValue(entry.commune_name) === normalizeValue(communeName)
    );
  return Number(selectedCommune?.[feeType] || 0);
};

export const buildWilayaLabel = (wilaya) =>
  wilaya?.id ? `${wilaya.id} - ${wilaya.name}` : wilaya?.name || "";
