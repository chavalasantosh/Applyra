import braintree from 'npm:braintree@3';
import {env} from './commerce-utils.ts';
export function gateway(){return new braintree.BraintreeGateway({environment:env('BRAINTREE_LIVE')==='true'?braintree.Environment.Production:braintree.Environment.Sandbox,merchantId:env('BRAINTREE_MERCHANT_ID'),publicKey:env('BRAINTREE_PUBLIC_KEY'),privateKey:env('BRAINTREE_PRIVATE_KEY')});}
export function merchant(){const id=env('BRAINTREE_MERCHANT_ACCOUNT_ID');if(!id)throw Error('Currency-specific BRAINTREE_MERCHANT_ACCOUNT_ID is required.');return id;}
