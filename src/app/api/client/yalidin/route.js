import { NextResponse } from "next/server";

const BASE_URL = process.env.YALIDINE_BASE_URL?.replace(/\/+$/, "") || "https://api.yalidine.com/v1";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const resource = (searchParams.get("resource") || "centers").toLowerCase();
  const apiId = process.env.YALIDINE_API_ID?.trim();
  const apiToken = process.env.YALIDINE_API_TOKEN?.trim();

  const endpointMap = {
    centers: "centers",
    communes: "communes",
    fees: "fees",
    wilayas: "wilayas",
  };

  const endpoint = endpointMap[resource] || "centers";
  const apiUrl = new URL(`${BASE_URL}/${endpoint}/`);

  if (endpoint === "fees") {
    const fromWilayaId =
      searchParams.get("from_wilaya_id") ||
      searchParams.get("fromWilayaId") ||
      searchParams.get("from_wilaya");
    const toWilayaId =
      searchParams.get("to_wilaya_id") ||
      searchParams.get("toWilayaId") ||
      searchParams.get("to_wilaya");
    if (!fromWilayaId || !toWilayaId) {
      return NextResponse.json(
        { error: "Les paramètres 'from_wilaya_id' et 'to_wilaya_id' sont requis pour les frais" },
        { status: 400 }
      );
    }
    apiUrl.searchParams.set("from_wilaya_id", String(Number(fromWilayaId)));
    apiUrl.searchParams.set("to_wilaya_id", String(Number(toWilayaId)));
  } else {
    const allowedParams = [
      "id", "center_id", "commune_id", "commune_name",
      "wilaya_id", "wilaya_name", "has_stop_desk", "is_deliverable",
      "fields", "page", "page_size", "order_by", "desc", "asc",
    ];
    allowedParams.forEach((param) => {
      const value = searchParams.get(param);
      if (value) apiUrl.searchParams.set(param, value);
    });
    const wilaya = searchParams.get("wilaya") || searchParams.get("wilaya_id") || searchParams.get("id");
    if (endpoint === "centers" && wilaya) {
      apiUrl.searchParams.set("wilaya_id", String(Number(wilaya)));
    }
  }

  try {
    if (!apiId || !apiToken) {
      return NextResponse.json(endpoint === "fees" ? {} : [], { status: 200 });
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-API-ID": apiId,
        "X-API-TOKEN": apiToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(endpoint === "fees" ? {} : [], { status: 200 });
    }

    const payload = await response.json();

    if (endpoint === "fees") {
      return NextResponse.json(payload);
    }

    const formattedData = payload?.data || payload || [];
    return NextResponse.json(Array.isArray(formattedData) ? formattedData : []);
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la récupération des données Yalidine",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
