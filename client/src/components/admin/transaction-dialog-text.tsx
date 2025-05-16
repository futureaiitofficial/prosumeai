import React from 'react';

const TransactionDialogExplanation: React.FC = () => {
  return (
    <div className="text-sm text-gray-600 mt-2">
      <p>Transaction history for the selected user and their subscriptions.</p>
      
      <div className="mt-3 text-xs bg-gray-50 p-3 rounded-md border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2">Understanding Transaction Types:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="font-medium">Authorization</span>: An initial transaction that verifies the payment method. 
            These typically show as $0.00 or a small amount and are part of Razorpay's subscription flow.
          </li>
          <li>
            <span className="font-medium">Subscription Payment</span>: A regular payment for the subscription plan.
          </li>
          <li>
            <span className="font-medium">Plan Upgrade</span>: A payment or adjustment made when upgrading to a higher plan.
          </li>
          <li>
            <span className="font-medium">Currency Mismatch</span>: A payment with a currency that doesn't match the user's expected region. 
            This could indicate an issue with payment processing or plan configuration.
          </li>
        </ul>
      </div>
      
      <div className="mt-3 text-xs bg-yellow-50 p-3 rounded-md border border-yellow-200">
        <h4 className="font-medium text-yellow-800 mb-2">About Duplicate Transaction Records:</h4>
        <p className="text-yellow-700 mb-2">
          Sometimes you may see two transaction records with the same Transaction ID but different amounts or currencies.
          This happens due to how Razorpay handles international transactions.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-yellow-700">
          <li>
            <span className="font-medium">Primary Record</span>: Usually the transaction with the correct currency for the user's region.
          </li>
          <li>
            <span className="font-medium">Duplicate Record</span>: Alternative record showing the same payment with different details.
          </li>
          <li>
            <span className="font-medium">Resolution</span>: The system has already applied logic to identify the primary record.
            No action is needed from you.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TransactionDialogExplanation; 