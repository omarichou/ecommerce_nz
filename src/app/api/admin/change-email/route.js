
import UserModal from "@/app/DBconfig/models/user";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";








export async function POST(request) {
  // 1- Receive data from Front-end
  const objFromFrontEnd = await request.json();
  console.log("***********************registerr*****************************");
  console.log(objFromFrontEnd);

  // 2- connect to DB
  await connectMongoDB();


  const user = await UserModal.findOne({ _id: process.env.NEXT_PUBLIC_admin_id }); //get information of admin
   
  if (!user) {
    return NextResponse.json({ message: "Utilisateur non trouvé.", erreur:true });
  }
  
  // data from front end
   const currentemail= objFromFrontEnd.currentemail
   const newemail= objFromFrontEnd.newemail

  // 3. Vérifier Email actuel
  
    if (currentemail != user.email ) {
      return NextResponse.json({message: "Email actuel incorrect.",  erreur:true });
    }

    

      // 5. Mettre à jour Email dans la base de données
      user.email = newemail;
      await user.save();



  // 4- Go back to frontend
  return NextResponse.json({message: "Email mis à jour avec succès.",  erreur:false});
}
