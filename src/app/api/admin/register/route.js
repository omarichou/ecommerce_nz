import UserModal from "@/app/DBconfig/models/user";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { uploadStream } from "@/assets/UploadImg_cloudinary";





export async function POST(request) {
  // 1- Receive data from Front-end
  const objFromFrontEnd = await request.formData();
  console.log("***********************registerr*****************************");
  console.log(objFromFrontEnd);

  // 2- connect to DB
  await connectMongoDB();


  // 3- hashing password
  
  const Password = objFromFrontEnd.get("password");
  const salt = await bcrypt.genSalt();
const hashedPassword = await bcrypt.hash(Password, salt);


//   upload image in cloudinary and get url
// add image to cloudinary & get url

const productImg = objFromFrontEnd.get("Img");

const bytes = await productImg.arrayBuffer();
const buffer = Buffer.from(bytes);
const uploadedImg = await uploadStream(buffer);
console.log(uploadedImg);
console.log("donnnnnnneeeeeeeee");

const img_url =  uploadedImg.secure_url

  // 3- Try to Store obj to DB
  console.log( objFromFrontEnd.get("Longitude"))
  console.log(objFromFrontEnd.get("Latitude"))

  await UserModal.create({
    name: objFromFrontEnd.get("name"),
    email: objFromFrontEnd.get("email"),
    password: hashedPassword,
    phoneNumber: objFromFrontEnd.get("telephone"),
    photo: img_url,
    role: objFromFrontEnd.get("type"),
    public_id_img: uploadedImg.public_id,
    Latitude: objFromFrontEnd.get("Latitude"),
    Longitude: objFromFrontEnd.get("Longitude"),
  });

  // 4- Go back to frontend
  return NextResponse.json({});
}
