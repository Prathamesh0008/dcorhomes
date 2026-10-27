// Loaded only by the controlled offline architecture test, never by application code.
if(process.env.DCORHOME_TEST_FORBID_MONGO==='true'){
 const {MongoClient}=require('mongodb');
 MongoClient.prototype.connect=async function(){
  console.error('FORBIDDEN_MONGODB_CONNECT');
  throw Error('MongoDB is deliberately unavailable in this controlled test.');
 };
}
