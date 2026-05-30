const YALIDINE_API_ID = process.env.YALIDINE_API_ID;
const YALIDINE_API_TOKEN = process.env.YALIDINE_API_TOKEN;
const YALIDINE_BASE_URL = process.env.YALIDINE_BASE_URL;

export const createYalidineShipment = async (order) => {
  try {
    const response = await fetch(`${YALIDINE_BASE_URL}/parcels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-ID': YALIDINE_API_ID,
        'X-API-TOKEN': YALIDINE_API_TOKEN,
      },
      body: JSON.stringify({
        to_wilaya: order.customerDetails.wilaya,
        to_commune: order.customerDetails.commune,
        to_name: order.customerDetails.fullName,
        to_phone: order.customerDetails.phoneNumber,
        address: order.customerDetails.address || order.customerDetails.commune,
        product_list: order.array_product.map(item => ({
          name: item.id_product.title.fr,
          price: item.id_product.price,
          quantity: item.quantite
        })),
        freeshipping: false,
        is_stopdesk: order.customerDetails.deliveryType === "relayPoint",
        order_id: order._id.toString(),
        weight: 1, // Poids en kg
        height: 10, // Dimensions en cm
        width: 10,
        length: 10,
        price: order.total,
        home_shipping_fees: order.deliveryFees,
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création du colis Yalidine');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Yalidine shipment:', error);
    throw error;
  }
};

export const getYalidineTracking = async (parcelId) => {
  try {
    const response = await fetch(`${YALIDINE_BASE_URL}/parcels/${parcelId}`, {
      headers: {
        'X-API-ID': YALIDINE_API_ID,
        'X-API-TOKEN': YALIDINE_API_TOKEN,
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du suivi Yalidine');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Yalidine tracking:', error);
    throw error;
  }
};
