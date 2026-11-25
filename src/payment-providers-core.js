(function(root){
  'use strict';
  const VERSION='2.0.0';
  const PROVIDERS=Object.freeze([
    {id:'stripe',label:'Stripe',surface:'hosted',subscription:false,cardFirst:true,regions:['GLOBAL']},
    {id:'paypal',label:'PayPal',surface:'hosted',subscription:false,cardFirst:false,regions:['GLOBAL']},
    {id:'cashfree',label:'Cashfree',surface:'hosted',subscription:false,cardFirst:false,regions:['IN']},
    {id:'upi',label:'UPI QR / merchant ID',surface:'qr',subscription:false,cardFirst:false,regions:['IN']},
    {id:'shopify',label:'Shopify store checkout',surface:'hosted',subscription:false,cardFirst:true,regions:['GLOBAL']},
    {id:'razorpay',label:'Razorpay',surface:'hosted',subscription:true,cardFirst:true,regions:['IN','GLOBAL']},
    {id:'adyen',label:'Adyen',surface:'hosted',subscription:true,cardFirst:true,regions:['US','CA','MX','DE','EU','GLOBAL']},
    {id:'checkout',label:'Checkout.com',surface:'hosted',subscription:true,cardFirst:true,regions:['US','CA','MX','DE','EU','GLOBAL']},
    {id:'paddle',label:'Paddle',surface:'hosted',subscription:true,cardFirst:true,regions:['US','CA','MX','DE','EU','GLOBAL']},
    {id:'braintree',label:'Braintree',surface:'hosted-fields',subscription:true,cardFirst:true,regions:['US','CA','DE','EU','GLOBAL']},
    {id:'mollie',label:'Mollie',surface:'hosted',subscription:true,cardFirst:true,regions:['DE','EU']}
  ]);
  function clean(v,max=120){return String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0,max);}
  function get(id){const key=clean(id,40).toLowerCase();return PROVIDERS.find(x=>x.id===key)||null;}
  function normalizeStatus(row={}){const p=get(row.id)||{id:clean(row.id,40),label:clean(row.label,80)||clean(row.id,40),surface:'unknown',subscription:false,cardFirst:false,regions:[]};return {...p,implemented:row.implemented!==false,configured:Boolean(row.configured)&&row.implemented!==false,liveTested:Boolean(row.liveTested),detail:clean(row.detail,280)};}
  function selectable(row={}){const p=normalizeStatus(row);return p.configured===true;}
  root.ApplyraPaymentProviders=Object.freeze({VERSION,PROVIDERS,get,normalizeStatus,selectable});
  if(typeof module!=='undefined'&&module.exports)module.exports=root.ApplyraPaymentProviders;
})(typeof globalThis!=='undefined'?globalThis:this);
