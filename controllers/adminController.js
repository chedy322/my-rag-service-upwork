import path from "path";
import { getLogs } from "../services/firebaseService.js";



export async function renderAdminPage(req, res) {
    return res.sendFile(path.join(process.cwd(), 'public', 'admin.html'));
}

export async function verifyAdminStatus(req, res) {
    console.log("trigered")
    return res.status(200).json({ status: "success", message: "Authenticated" });
}


export async function getLogsforAdmin(req,res){
    
    try{
        const results=await getLogs();
        return res.status(200).json({
            logs:results
        })
    }
    catch(err){
        return res.status(500).json(
           { error:"Something went wrong getting logs"}
        )
    }
}