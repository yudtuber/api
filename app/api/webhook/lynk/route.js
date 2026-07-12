import {verifySignature} from '@/lib/verifySignature';

export async function GET(){
 return Response.json({status:'Webhook Ready'});
}

export async function POST(request){
 const signature=request.headers.get('x-lynk-signature');
 const body=await request.json();
 if(!verifySignature(body,signature)){
   return Response.json({success:false,message:'Invalid Signature'},{status:401});
 }
 console.log(body);
 return Response.json({success:true});
}
