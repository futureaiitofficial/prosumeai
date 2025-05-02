declare module '@paypal/checkout-server-sdk' {
  namespace core {
    class PayPalHttpClient {
      constructor(environment: any);
      execute(request: any): Promise<any>;
    }
    
    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    
    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
  }
  
  namespace orders {
    class OrdersCreateRequest {
      setRequestBody(body: any): void;
    }
    
    class OrdersGetRequest {
      constructor(orderId: string);
    }
    
    class OrdersCaptureRequest {
      constructor(orderId: string);
    }
  }
}

declare module '@paypal/paypal-js' {
  export function loadScript(options: {
    'client-id': string;
    currency?: string;
    intent?: string;
    'data-client-token'?: string;
    components?: string[];
  }): Promise<any>;
} 