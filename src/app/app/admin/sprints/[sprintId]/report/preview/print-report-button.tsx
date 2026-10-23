"use client";
import {useState} from "react";
type Props={label:string;warning:string};
export default function PrintReportButton({label,warning}:Props){
 const [accepted,setAccepted]=useState(false);
 return <div className="d-print-none my-3">
 {!accepted?<button type="button" className="btn btn-outline-primary" onClick={()=>setAccepted(true)}>{label}</button>:
 <div className="alert alert-warning">
 <p>{warning}</p>
 <button type="button" className="btn btn-primary" onClick={()=>window.print()}>{label}</button>
 </div>}
 </div>;
}
