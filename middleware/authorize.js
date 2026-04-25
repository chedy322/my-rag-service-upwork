
import { decodedFIREBASE_SERVICE_ACCOUNT } from "../utils/decode.js";
import { getUserById } from "../services/firebaseService.js";
import { getFirebaseContext } from "../config/firebase.js";





export const authorize=async (req,res,next)=>{
        const token=req.headers.authorization?.split("Bearer ")[1];
        if(!token){
            return res.status(403).json({error: "Access denied"})
        }
         try{
            const { auth } = await getFirebaseContext();
          const decodedToken = await auth.verifyIdToken(token);

          const userDetails=await getUserById(decodedToken.uid);
          if(!userDetails){
            return res.status(403).json({ error: "Access denied" });
          }
        if (userDetails.role==="ADMIN") {
                req.user = decodedToken;
                next();
            } else {
             return res.status(403).json({ error: "Access denied" });
            }
        }
        catch(err){
            return res.status(401).json({ error: "Access denied" });
    }
}