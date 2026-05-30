import OrderModal from "@/app/DBconfig/models/Order";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";


export async function DELETE(request) {
  // 1- Receive data from Front-end
  const objFromFrontEnd = await request.json();
  console.log("*******************************************");
  console.log(objFromFrontEnd);

  // 2 connect to DB
  await connectMongoDB();

  // 3- Delete data

  console.log(objFromFrontEnd);
  await OrderModal.deleteOne({ _id:objFromFrontEnd.id  });



  // 4- Go back to frontend
  return NextResponse.json({});
}
