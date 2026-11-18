// Read-only configuration/provider diagnostics. No email is sent; no secret values are printed.
require('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
require('./auth-loader.cjs');
const {enquiryEmailConfiguration,resendFailure}=require('../lib/server/enquiry-email-configuration.ts');
(async()=>{
 const configuration=enquiryEmailConfiguration();
 console.log(JSON.stringify({event:'enquiry_email_configuration',ready:!configuration.issues.length,invalidSettings:configuration.issues,senderVariable:configuration.senderVariable||null,recipient:configuration.recipient}));
 if(configuration.issues.length)process.exitCode=1;
 if(!process.argv.includes('--verify'))return;
 if(!configuration.apiKey){console.log(JSON.stringify({event:'resend_domain_check',status:'blocked',category:'missing_api_key'}));return;}
 // Deliberately invalid empty payload: checks the sending endpoint's auth response without sending mail.
 const sending=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+configuration.apiKey,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(12000)});
 const sendingResult=await sending.json().catch(()=>null);
 console.log(JSON.stringify({event:'resend_send_auth_check',...resendFailure(sending.status,sendingResult),emailSent:false}));
 let after,verified=false;
 for(let page=0;page<10;page++){
  const response=await fetch('https://api.resend.com/domains?limit=100'+(after?'&after='+encodeURIComponent(after):''),{headers:{Authorization:'Bearer '+configuration.apiKey},signal:AbortSignal.timeout(12000)});
  const result=await response.json().catch(()=>null);
  if(!response.ok){console.log(JSON.stringify({event:'resend_domain_check',...resendFailure(response.status,result),senderDomainVerified:'unverified_by_probe'}));process.exitCode=1;return;}
  if(!Array.isArray(result?.data))throw Error('Unexpected provider response');
  const domain=configuration.address.split('@')[1]?.toLowerCase();
  const match=result.data.find(item=>typeof item.name==='string'&&item.name.toLowerCase()===domain);
  if(match){verified=match.status==='verified';console.log(JSON.stringify({event:'resend_domain_check',status:response.status,senderDomainVerified:verified,domainStatus:['verified','not_started','pending','failed','temporary_failure'].includes(match.status)?match.status:'unknown'}));if(!verified)process.exitCode=1;return;}
  if(!result.has_more||!result.data.length){console.log(JSON.stringify({event:'resend_domain_check',status:response.status,senderDomainVerified:false,category:'sender_domain_not_found'}));process.exitCode=1;return;}
  after=result.data.at(-1).id;
 }
 console.log(JSON.stringify({event:'resend_domain_check',senderDomainVerified:'unverified_by_probe',category:'pagination_limit'}));process.exitCode=1;
})().catch(()=>{console.error(JSON.stringify({event:'resend_domain_check',category:'network_or_provider_response_failure',senderDomainVerified:'unverified_by_probe'}));process.exitCode=1;});
