// This file is for firebase services

import { getFirebaseContext } from "../config/firebase.js"
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from "firebase-admin/firestore";
// Firestore for users and for logs

const {db}=await getFirebaseContext()
export async  function getUserById(userId){
    const userResult=await db.collection("users").doc(userId).get()
    
    return !userResult.exists?null:userResult.data()
}


export async function registerLog(eventName,userIssuedEventEmail,documentName,ipAddress){
  try {
    const data = {
      documentName,
      eventName,
      ipAddress,
      userEmail: userIssuedEventEmail,
      createdAt: FieldValue.serverTimestamp(),
    };

    await db.collection("logs").add(data);
  
  } catch (err) {
    console.error(" Failed to save log:", err.message);
    throw err;
  }
}


export async function getLogs(){
    try{
      let result=[]
        const snapshot=await db.collection("logs")
        .orderBy("createdAt","desc")
        .get();
        snapshot.forEach(doc => {
      const data=doc.data()
      result.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString(): null
      });
});

  return result;
    }catch(err){
      console.log(" Failed to get logs", err.message)
      throw err;
    }
}






// FireStorage for uploading and getting the uploaded file

export async function registerDocument(documentId,name,storagePath){
  try{

    const data={
      name,
      status:"COMPLETED",
      storagePath,
      createdAt: FieldValue.serverTimestamp()
    }
  
    await db.collection('documents').doc(documentId).set(data)
  }catch(err){
    throw err;
  }
}

export async function getDocuments(){
try{
      let result=[]
        const snapshot=await db.collection("documents")
        .orderBy("createdAt","desc")
        .get();
        snapshot.forEach(doc => {
          console.log(doc.data())
      const data=doc.data()
      result.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString(): null
      });
});

  return result;

}catch(err){
  throw err;
}
}

export async function getDocumentById(documentId){
  const doc= await db.collection("documents").doc(documentId).get()
  return doc.data()
}
export async function  deleteDocumentFromFirebase(documentId){
 try{
 const docRef = await db.collection("documents").doc(documentId);
    await docRef.delete();
 }catch(err){
  throw err;
 }
}