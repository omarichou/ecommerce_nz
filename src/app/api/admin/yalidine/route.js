import OrderModal from "@/app/DBconfig/models/Order";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { wilayasWithPrices2 } from "@/assets/array_wilaya";
import { NextResponse } from "next/server";


export async function POST(request) {
  try {
    // 1. Connexion à la base de données
    await connectMongoDB();
    const { orderId } = await request.json();
    const order = await OrderModal.findById(orderId).populate('array_product.id_product');
    console.log(order)

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // 2. Trouver les données de la wilaya et commune
    const wilayaData = wilayasWithPrices2.find(w => 
      w.name.includes(order.customerDetails.wilaya) || 
      w.name_sans_Nm.toLowerCase() === order.customerDetails.wilaya.toLowerCase()
    );

    if (!wilayaData) {
      throw new Error(`Wilaya "${order.customerDetails.wilaya}" non reconnue`);
    }

    const communeData = wilayaData.communes.find(c => 
      c.name.toLowerCase() === order.customerDetails.commune?.toLowerCase()
    );

    if (!communeData && order.customerDetails.deliveryType === "homeDelivery") {
      throw new Error(`Commune "${order.customerDetails.commune}" non reconnue pour la wilaya ${wilayaData.name_sans_Nm}`);
    }

    const total_price_sans_livraison = order.total - order.deliveryFees;
    const isRelayPoint = order.customerDetails?.deliveryType === "relayPoint";

    // 3. Construction du payload complet pour Yalidine
    const payload = [
      {
        order_id: `YAL-${order._id.toString()}-${Date.now()}`,
        firstname: order.customerDetails?.fullName?.split(' ')[0]?.substring(0, 50) || "Client",
        familyname: order.customerDetails?.fullName?.split(' ').slice(1).join(' ')?.substring(0, 50) || "Client",
        contact_phone: formatPhone(order.customerDetails?.phoneNumber),
        address: `${communeData?.name }, ${wilayaData.name_sans_Nm }`,
        to_commune_id: parseInt(wilayaData.name.split(" - ")[0]),
        to_commune_name:isRelayPoint ? order.customerDetails?.relayPoint?.commune_name  :  communeData?.name ,
        to_wilaya_id: parseInt(wilayaData.name.split(" - ")[0]),
        to_wilaya_name: wilayaData.name_sans_Nm,
        product_list: order.array_product.map(p => 
          `${p.quantite}x ${p.id_product?.title?.fr || "Produit"}`).join(", "),
        price: total_price_sans_livraison,
        weight: 0.5, // Vous pouvez calculer ce poids dynamiquement si nécessaire
        is_stopdesk: isRelayPoint,
        ...(isRelayPoint && {
          stopdesk_id:  order.customerDetails?.relayPoint?.center_id, // Remplacez par l'ID réel du point relais
          stopdesk_name: order.customerDetails?.relayPoint?.name
        }),

        with_return: false,
        freeshipping: false,
        has_exchange: false,
        client_id: order.id_user.toString()
      }
    ];

    console.log("Payload complet:", JSON.stringify(payload, null, 2));

    // 4. Envoi à Yalidine
    const response = await fetch('https://api.yalidine.com/v1/parcels/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-ID': process.env.YALIDINE_API_ID,
        'X-API-TOKEN': process.env.YALIDINE_API_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("Réponse complète Yalidine:", result);

    // 5. Gestion des réponses
    if (!response.ok) {
      throw new Error(result.message || "Erreur lors de la création du colis");
    }

    // Nouvelle vérification de la réponse
    const firstParcel = Object.values(result)[0];
    if (!firstParcel?.tracking) {
      throw new Error(firstParcel?.message || "Réponse inattendue de Yalidine");
    }

    // 6. Mettre à jour la commande avec les infos de suivi
    // order.trackingNumber = firstParcel.tracking;
    // order.trackingUrl = `https://yalidine.com/${firstParcel.tracking}`;
    // order.status = "envoyé";
    // await order.save();

    return NextResponse.json({
      success: true,
      parcel_id: firstParcel.order_id,
      tracking_url: `https://yalidine.com/${firstParcel.tracking}`,
      tracking_number: firstParcel.tracking
    });

  } catch (error) {
    console.error("Erreur finale:", error);
    return NextResponse.json(
      { error: error.message || "Une erreur est survenue lors de la création du colis" },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour le téléphone
function formatPhone(phone) {
  if (!phone) return "0555555555";
  const cleaned = phone.toString().replace(/\D/g, '');
  return cleaned.startsWith('0') ? cleaned : `0${cleaned.substring(0, 9)}`;
}

// Fonction pour trouver une wilaya par son nom ou ID
export function getWilayaByName(name) {
  return wilayasWithPrices2.find(w => 
    w.name.includes(name) || 
    w.name_sans_Nm.toLowerCase() === name.toLowerCase()
  );
}

// Fonction pour trouver une commune et son supplément
export function getCommuneSupplement(wilayaName, communeName) {
  const wilaya = getWilayaByName(wilayaName);
  if (!wilaya) return 0;
  
  const commune = wilaya.communes.find(c => 
    c.name.toLowerCase() === communeName.toLowerCase()
  );
  
  return commune ? commune.supplement : 0;
}

// Fonction pour calculer les frais de livraison
export function calculateDeliveryFees(wilayaName, communeName, deliveryType) {
  const wilaya = getWilayaByName(wilayaName);
  if (!wilaya) throw new Error("Wilaya non reconnue");
  
  const basePrice = deliveryType === "homeDelivery" 
    ? wilaya.homeDelivery 
    : wilaya.relayPoint;
    
  const supplement = getCommuneSupplement(wilayaName, communeName);
  
  return basePrice + supplement;
}