import React from 'react';
import PortMasterPage from './PortMasterPage';

const DeliveryPortMasterPage: React.FC = () => (
  <PortMasterPage
    endpoint="/sea-delivery-ports"
    title="Delivery Port Master"
    subtitle="Create and manage Indian delivery ports (ICD/CFS/SEZ). Used by the Delivery Port field on the HBL entry form."
    codePlaceholder="e.g. INNSA1"
    namePlaceholder="e.g. NHAVA SHEVA"
  />
);

export default DeliveryPortMasterPage;
